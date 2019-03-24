# Redis

## 1. Redis简介
Redis 是一个支持数据结构更多的键值对数据库。它的值不仅可以是字符串等基本数据 类型,也可以是类对象,更可以是 Set、List、计数器等高级的数据结构。

Memcached 也可以保存类似于 Set、List 这样的结构,但是如果说要向 List 中增加元素, Memcached 则需要把 List 全部元素取出来,然后再把元素增加进去,然后再保存回去,不仅效率低,而且有并发访问问题。Redis 内置的 Set、List 等可以直接支持增加、删除元素的 操作,效率很高,操作是原子的。

Memcached 数据存在内存中,memcached 重启后数据就消失;而 Redis 会把数据持久化到硬盘中,Redis 重启后数据还存在。

1) 优点
* 支持 string、list、set、geo 等复杂的数据结构。
* 高命中的数据运行时是在内存中,数据最终还是可以保存到磁盘中,这样服务器重 启之后数据还在。
* 服务器是单线程的,来自所有客户端的所有命令都是串行执行的,因此不用担心并 发修改(串行操作当然还是有并发问题)的问题,编程模型简单;
* 支持消息订阅/通知机制,可以用作消息队列;
* Key、Value 最大长度允许 512M;

2) 缺点
* Redis 是单线程的,因此单个 Redis 实例只能使用一个 CPU 核,不能充分发挥服务器的性能。可以在一台服务器上运行多个 Redis 实例,不同实例监听不同端口,再互相组成集群。
* 做缓存性能不如 Memcached;

Redis高级教程参阅 https://blog.csdn.net/hjm4702192/article/details/80518856

## 2. Redis 安装
### 2.1 Redis Server
```sh
docker pull redis

docker run \
-d \
--name redis \
-p 6379:6379 \
redis \
--requirepass "123123"
```
### 2.2 Redis Client
Redis客户端有其命令行，也有第三方GUI客户端。比较流行有是开源跨平台的[RedisDesktopManager](https://github.com/uglide/RedisDesktopManager)。

## 3. Redis 使用
### 3.1 .NET 驱动
.NET Core平台下，ServiceStack.Redis 是商业版，免费版有限制。StackExchange.Redis 2.0之前版本有超时问题，现已解决。除了这两个传统的库之外，国内大牛也开了一些优秀的高性能.Net Core的Redis组件，供我们选择。

* [NewLife.Redis](http://git.newlifex.com/NewLife/NewLife.Redis) 他是NewLife团队开发的，已经在ZTO大数据实时计算中广泛应用，200多个Redis实例稳定工作一年多，每天处理近1亿包裹数据，日均调用量80亿次。
* [CSRedis](https://github.com/2881099/csredis) (这里我更喜欢把它叫做CSRedisCore)这是另一个国内大牛nicye 开发的，为人很低调，所以了解他的人很少！目前我项目中广泛使用的也是这个。作者前不久刚做了一个几大Redis组件的性能测试.net core 2.0 redis驱动性能比拼 有兴趣的可以打开链接看一下。

详细对比和使用方式可参阅以下文档：
* https://www.cnblogs.com/yilezhu/p/9947905.html
* https://www.cnblogs.com/yilezhu/p/9941208.html

下面我们以使用最广泛的[StackExchange.Redis](https://stackexchange.github.io/StackExchange.Redis/)为例讲解。

### 3.2 基础知识

* 不同系统放到 Redis 中的数据是不隔离的,因此设定 Key 的时候也要特别注意。
* Redis 服务器默认建了 16 个数据库,Redis 的想法是让大家把不同系统的数据放到不同的数据库中。但是建议大家不要这样用,因为 Redis 是单线程的,不同业务都放到同一个 Redis 实例的话效率不高,建议放到不同的实例中。因此尽量只用默认的 db0 数据库。
* Redis 支持的数据结构有 string、list、set、sortedset、hash、geo(redis 3.2 以上版本)。对应的 Redis 客户端里的方法都是 StringXXX、HashXXX、GeoXXX 等方法。不同数据类型的操作方 法不能混用,比如不能用 ListXXX 写入的值用 StringXXX 去读取或者写入等操作。
* Redis的所有数据类型本质上最终存储的都是String类型，Set等高级类型只是使用不同数据结构管理String类型。所以Redis中并不能存储复杂对象，但可序列化后存储。

### 3.3 连接Redis

```csharp
var redis = ConnectionMultiplexer.Connect("localhost:6379");//官方推荐重用Redis连接而不是每次用完释放
IDatabase db = redis.GetDatabase();//默认访问 db0 数据库,可以指定数字访问不同的数据库
```

* 支持设置过期时间:`db.StringSet("key", "value", TimeSpan.FromSeconds(10))`
* 获取数据:`string s = db.StringGet("key")`如果查不到则返回 null
* 参数、返回值 `RedisKey`、`RedisValue` 类型,进行了运算符重载,可以和 `string`、 `byte[]`之间进行隐式转换。

### 3.3 Key操作
Redis 里所有数据类型都是用 Key-Value 保存,因此 **Key 操作是针对所有数据类型**。

方法|作用
:-|:-
`KeyDelete(RedisKey key)`|根据 Key 删除;
`KeyExists(RedisKey key)`|判断 Key 是否存在,存在并发问题;
`KeyExpire(RedisKey key, TimeSpan? expiry)`|设置过期时间

### 3.4 String
方法|作用
:-|:-
db.StringAppend(RedisKey key, RedisValue value)|附加内容,不存在则新建;
db.StringIncrement("count", 2.5)|计数器加值
db.StringDecrement("count",1)|计数器减值

计数器不存在则从0开始计，可以以此来计算新闻点击量、点赞量,非常高效。

### 3.5 List
Redis 中 List是双向链表，长度是无限，左右都可出入元素。可以当成双向队列或者双向栈用,比如可以把聊天记录、商品的物流信息等保存到 List 中。

方法|作用
:-|:-
ListLeftPush(RedisKey key, RedisValue value)|从左侧压栈
RedisValue ListLeftPop(RedisKey key)|从左侧弹出
ListRightPush(RedisKey key, RedisValue value)|从右侧压栈
RedisValue ListRightPop(RedisKey key)|从右侧弹出
RedisValue ListGetByIndex(RedisKey key, long index)|获取 List 中第 index 个元素的值
long ListLength(RedisKey key)|获取List 中元素个数
RedisValue[] ListRange(RedisKey key, long start = 0, long stop = -1)|读但不取出元素

*ListGetByIndex,ListLength 会有并发问题*

左进左出或右进右出则可作为栈使用，左进右出或右进左出则可作为队列使用。可以使用Redis的List用作轻量的消息队列使用。

### 3.6 Set
Set 是一个元素去重的集合。如使用 Set 保存禁用用户 id 等,就不用做重复性判断了。

注意 Set 不是按照插入顺序遍历的,而是按照自己的一个存储方式来遍历。

方法|作用
:-|:-
bool SetAdd(RedisKey key, RedisValue value)|向 Set 中增加元素，如果已存在则返回false
bool SetContains(RedisKey key, RedisValue value)|判断 Set 中是否存在某个元素
long SetLength(RedisKey key)|获得 Set 中元素的个数
SetRemove(RedisKey key, RedisValue value)|从 Set 中删除元素
RedisValue[] SetMembers(RedisKey key)|获取集合中的元素

*SetContains,SetLength 会有并发问题*

### 3.7 SortedSet
与Set相比SortedSet除了key,value外还提供了一个score字段记录数据记录的“分数”。如果对于数据遍历顺序有要求,可以使用 SortedSet,它会按照分数来进行遍历。

方法|作用
:-|:-
SortedSetAdd(RedisKey key, RedisValue member, double score)|添加数据记录和分数,如果存在则覆盖
double SortedSetIncrement(RedisKey key, RedisValue member, double value)| 增加分数
double SortedSetDecrement(RedisKey key, RedisValue member, double value)|减少分数
SortedSetEntry[] SortedSetRangeByRankWithScores(RedisKey key, long start = 0, long stop = -1, Order order = Order.Ascending)|根据排序返回元素以及元素的分数。start、stop 用来分页查询、order 指定排序规则。
RedisValue[] SortedSetRangeByRank(RedisKey key, long start = 0, long stop = -1, Order order = Order.Ascending)|根据排序返回，如返回TOP10元素
RedisValue[] SortedSetRangeByScore(RedisKey key, double start = double.NegativeInfinity, double stop = double.PositiveInfinity, Exclude exclude = Exclude.None, Order order = Order.Ascending, long skip = 0, long take = -1)|根据分数返回。如返回大于90分的元素

> 应用场景

* 热搜榜。每搜一次一个关键词,就给这个关键词加一分，最后提取 TOP-N 即可
* 热门商品
* 积分投票

### 3.8 Hash
Hash的value 是一个“键值对集合”或者值是另外一个 Dictionary。可以用于存储对象，类似于Json方式存储对象。

### 3.9 Geo
Geo 是 Redis 3.2 版本后新增的数据类型,用来保存兴趣点(POI,point of interest)的坐标信息。 可以实现计算两 POI 之间的距离、获取一个点周边指定距离的 POI。可用于搜索指定地理位置周边的数据，如嘀嘀打车，附近的人等。

## 4. 高级操作
### 4.1 批量操作
频繁操作会影响Redis性能,我们可以使用批量操作来较少请求次数。
* 1) 数组操作
    几乎所有操作都支持数组类型,这样就可以一次性操作多条数据,如SortedSetAdd(RedisKey key, SortedSetEntry[] values)
* 2) 批量模式
```csharp
IBatch batch = db.CreateBatch();
db.StringSet("abc", "123");
db.GeoAdd("ShopsGeo1", new GeoEntry(116.34039, 39.94218, "1"));
batch.Execute();
```
CreateBatch()、Execute()之间的操作会一次性提交给Redis服务器。

### 4.2 发布订阅
Redis 发布订阅(pub/sub)是一种消息通信模式：发送者(pub)发送消息，订阅者(sub)接收消息。Redis 客户端可以订阅任意数量的频道。

![Redis发布订阅示意图](../img/nosql/pubsub.png)

```csharp
//发布
var pub = ConnectionMultiplexer.Connect(connectionString).GetSubscriber();
await pub.PublishAsync("channel1","message content");
```
```csharp
//订阅
var pub = ConnectionMultiplexer.Connect(connectionString).GetSubscriber();
await pub.SubscribeAsync("channle1", (chn, msg) => Console.Writeline(msg));
```
发布订阅和List作队列使用，分别实现了发布订阅模式和生产者消费者模式，可以作轻量级消息队列使用，处理并发和解除应用间耦合关系等。

### 4.3 分布式锁
多线程中的 lock 等的作用范围是当前的程序范围内的,如果想跨多台服务器的锁(尽量避免这样搞),就要使用分布式锁，如作秒杀活动等。

分布式锁一般有三种实现方式：
* 数据库乐观锁
* 基于Redis的分布式锁
* 基于ZooKeeper的分布式锁

这里我们主要介绍基于Redis的分布式锁。

```csharp
/// <summary>
/// 获取分布式锁并执行
/// </summary>
/// <param name="action">获取锁成功时执行的业务方法</param>
/// <param name="key">要锁定的key。用相同且唯一的key来当竞争对象,即要锁的对象</param>
/// <param name="value">给value赋值是为了明确锁是哪个请求加的,解锁时也必须是具有相同value的请求才能解锁，保证不会被其他请求解锁。</param>
/// <param name="expiryMillisecond">超时时间</param>
/// <returns>竞争锁是否成功</returns>
public async Task<bool> LockExecuteAsync(Action action, string key, string value,
    int expiryMillisecond = 3000)
{
    //竞争锁
    if (!await Db.LockTakeAsync(key, value, TimeSpan.FromMilliseconds(expiryMillisecond)))
        return false;

    try
    {
        //获取锁后执行业务方法
        action();
        return true;
    }
    finally
    {
        Db.LockRelease(key, value);//解锁
    }
}
```

```csharp
var guid = Guid.NewGuid().ToString();
Redis.LockExecuteAsync(()=>Console.Writeline("成功抢到锁"),"lockKey",guid);
```

## 5. RedisHelper
Redis的大部分常用操作都是相同的，这里我们基于`StackExchange.Redis`和`.Net Standard 2.0`封装一个帮助类。

* 包含String,List,Set,SortedSet,Hash等常用数据类型操作。
* 支持发布订阅
* 支持批量执行
* 支持分布式锁

代码已上传到Github，这里不再展开。
https://github.com/colin-chang/RedisHelper

具体使用方式可以查看单元测试
https://github.com/colin-chang/RedisHelper/blob/master/ColinChang.RedisHelper.Test/RedisHelperTest.cs

> 该帮助累已发布到Nuget

```sh
# Package Manager
Install-Package ColinChang.RedisHelper

# .NET CLI
dotnet add package ColinChang.RedisHelper
```