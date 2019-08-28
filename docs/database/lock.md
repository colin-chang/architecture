# 数据库锁

## 1. 数据库并发
高并发(很多人在操作这个系统。某个操作分为 ABC 三步,在 1 这个用户刚执行到 B 的 之后,2 这个用户也开始执行 A。)的系统中会遇到数据并发修改的问题,如下几个场景:

抢票:假设有 100 张票 `T_Tickets(Id,Name,Amount)`,有一行数据【1,"D168",100】
如果执行如下的抢票操作:首先执行 `select Amount from T_Tickets where Name=' D168'` 如果查到还有票的话,再 `Update T_Tickets Set Amount=Amount-1 Where Name=' D168'`
在高并发的场景下会出现“超卖”的情况。

打车软件中司机抢一个订单:`T_Orders(Id,Customer,DriverId)`,有一行数据 【1,"张三",null】
如果执行如下的抢单操作:首先查询一下这个订单是否有被人抢了`select DriverId from where Id=1`,如果没有被人抢,则`Update T_Orders set DriverId=@did where Id=1`。在高并发场景下就会出现两个人都提示抢单成功,但是稍早抢到单的最后后反而发现抢单者不是自己。

## 2. 数据库锁

悲观锁:很悲观,每次去拿数据的时候都认为别人会修改,所以每次在拿数据的时候都 会“上锁”,操作完成之后再“解锁”。在数据加锁期间,其他人如果来操作数据就会等待(即使查询也要等待),直到去掉锁。数据库中的悲观锁有“表锁”、“行锁”等。

乐观锁:很乐观,认为不会占用,自己先占了再说,占完了之后再看看是不是占上了, 如果没占上就是失败了。

两种锁各有优缺点。悲观锁使用的体验更好,但是对系统性能的影响大,只适合并发量不大的场合。乐观锁适用于“写少读多”的情况下,加大了系统的整个吞吐量,但是“乐观 锁可能失败”给用户的体验不好。

悲观锁容易引起死锁,而且性能低,大部分系统的特点都是“读多、写少”,因此除非特殊情况, 否则都推荐使用乐观锁, 当然如果是使用也推荐更傻瓜化的 捕捉`DbUpdateConcurrencyException`这种“傻瓜化”的方案。

(*)锁分为两个维度:锁等级(共享锁、排他锁等)和锁范围(行锁、表锁)。主流数据库都支持这些锁,不过语法有差别。
(*)死锁:事务 1 依次锁定 A、B;事务 2 依次锁定 B、A。他们两个如果碰到一起就会产生死锁。

数据库事务、锁和死锁等问题，参考 http://www.cnblogs.com/knowledgesea/p/3714417.html

### 2.1 悲观锁

EF 不支持悲观锁,只能写原生 SQL。
一定要在同一个事务中。在查询语句的表名后加上`with (xlock,ROWLOCK)`。`xlock` 表示“排 他锁”,一旦加上排他锁,那么其他人再获得这个锁的话就要等待开锁(事务结束)。 `ROWLOCK` 为行锁,为锁定查询出来的行。

#### 1) EF方式
```csharp
Console.WriteLine("输入你的名字");
string bf=Console.ReadLine();
using (MyDbContext ctx = new MyDbContext())
using (var tx = ctx.Database.BeginTransaction())
{
    Console.WriteLine("开始查询");
    //一定要遍历一下 SqlQuery 的返回值才会真正执行 SQL
    var g = ctx.Database.SqlQuery<Girl>("select * from T_Girls with (xlock,ROWLOCK) where id=1 ").Single();
    Console.WriteLine("结束查询");
    Console.WriteLine("开始 Update");
    ctx.Database.ExecuteSqlCommand("Update T_Girls set BF={0} where id=1", bf);
    Console.WriteLine("结束 Update");
    Console.WriteLine("按任意键结束事务");
    Console.ReadKey(); 

    try
    {
        tx.Commit();
    }
    catch(Exception ex)
    {
        Console.WriteLine(ex);//别忘了打印异常,否则出错了都不知道
        tx.Rollback();
    }
}
```

#### 2) 原生SQL
```csharp
string connstr = ConfigurationManager.ConnectionStrings["connstr"].ConnectionString;
using (SqlConnection conn = new SqlConnection(connstr))
{
    conn.Open();
    using (var tx = conn.BeginTransaction())
    {
        try
        {
            Console.WriteLine("开始查询");
            using (var selectCmd = conn.CreateCommand())
            {
                selectCmd.Transaction = tx;
                selectCmd.CommandText = "select * from T_Girls with(xlock,ROWLOCK) where id=1";
                using (var reader = selectCmd.ExecuteReader())
                {
                    if(!reader.Read())
                    {
                        Console.WriteLine("没有id为1的女孩");
                        return;
                    }

                    string bf = null;
                    if(!reader.IsDBNull(reader.GetOrdinal("BF")))
                        bf = reader.GetString(reader.GetOrdinal("BF"));

                    if(!string.IsNullOrEmpty(bf))//已经有男朋友
                    {
                        if(bf==myname)
                            Console.WriteLine("早已经是我的人了");
                        else
                            Console.WriteLine("早已经被"+bf+"抢走了");

                        Console.ReadKey();
                        return;
                    }

                    //如果 bf==null,则继续向下抢
                }

                Console.WriteLine("查询完成,开始 update");
                using (var updateCmd = conn.CreateCommand())
                {
                    updateCmd.Transaction = tx;
                    updateCmd.CommandText = "Update T_Girls set BF='aaa' where id=1";
                    updateCmd.ExecuteNonQuery();
                }

                Console.WriteLine("结束 Update");
                Console.WriteLine("按任意键结束事务");
                Console.ReadKey();
            }

            tx.Commit();
        }

        catch (Exception ex)
        {
            Console.WriteLine(ex);
            tx.Rollback();
        }
    }
}
```

第一个事务结束后第二个才会执行查询。

### 2.2 乐观锁
数据库中有一个特殊的字段类型 `rowversion`,列名叫什么无所谓,这个字段的值不需要 程序员去维护,每次修改这行数据的时候,对应的 `rowversion` 都会自动的变化(一般是增加)。

有的资料中可能提到的是 `timestamp` 类型,在其他数据库中也支持`timestamp`。SQLServer 中也支持 `timestamp`,但是微软更推荐 SQLServer 中使用 `rowversion` 类型。

乐观锁“抢女友”的思路很简单:抢之前查一下女友的 `rowversion` 的值,假如查出来是 666。那么就执行 `update T_Girls set BF='yzk' where id=1 and [rowversion]=666`。

执行之后如果发现“执行受影响的行数是 0”,就说明在这之前已经有人“抢先了”,因此“抢 单失败”。

给表增加一个 `rowversion` 类型的字段,比如名字也叫 `rowversion`。实体类中对应的属性类型要写成 byte[]。然后 FluentAPI 中配置:`Property(e => e.RowVersion).IsRowVersion()`;

#### 1) EF方式
```csharp
string bf = Console.ReadLine();
using (MyDbContext ctx = new MyDbContext())
{
    ctx.Database.Log = (sql) => { Console.WriteLine(sql); };
    var g = ctx.Girls.First();
    if (g.BF != null)
    {
        Console.WriteLine(g.BF == bf ? "早已经是你的人了呀,还抢啥?" : "来晚了,早就被别人抢走了");

        Console.ReadKey();
        return;
    }

    Console.WriteLine("点击任意键,开抢(模拟耗时等待并发)");
    Console.ReadKey();

    g.BF = bf;
    try
    {
        ctx.SaveChanges();
        Console.WriteLine("抢媳妇成功");
    }

    catch (DbUpdateConcurrencyException)
    {
        Console.WriteLine("抢媳妇失败");
    }
}

Console.ReadKey();
```
EF 会在 `SaveChanges()` 之后去检查 `RowVersion` 是否有变化,如果发现和之前查的时候不一致就会抛 `DbUpdateConcurrencyException`异常。

(*)参考资料:http://www.cnblogs.com/Gyoung/archive/2013/01/18/2866649.html

#### 2) 原生SQL
```csharp
using (MyDbContext ctx = new MyDbContext())
{
    var bf = Console.ReadLine();
    var g = ctx.Database.SqlQuery<Girl>("select * from T_Girls where id=1").Single();
    if (g.BF != null)
    {
        Console.WriteLine(g.BF == bf ? "早已经是你的人了呀,还抢啥?" : "来晚了,早就被别人抢走了");
        Console.ReadKey();
        return;
    }

    Console.WriteLine("点击任意键,开抢(模拟耗时等待并发)");
    Console.ReadKey();

    Thread.Sleep(3000);
    int affectRow = ctx.Database.ExecuteSqlCommand("update T_Girls set BF={0} where id=1 and RowVersion={1}",
        bf, g.RowVersion);
    switch (affectRow)
    {
        case 0:
            Console.WriteLine("抢媳妇失败");
            break;
        case 1:
            Console.WriteLine("抢媳妇成功");
            break;
        default:
            Console.WriteLine("什么鬼");
            break;
    }
}
```
