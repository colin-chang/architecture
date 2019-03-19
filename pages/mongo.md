# MongoDB

## 1. 简介
MongoDB 是一个基于分布式文件存储的数据库,旨在为 WEB 应用提供可扩展的高性能数据存储解决方案。

MongoDB是专为可扩展性，高性能和高可用性而设计的数据库。它可以从单服务器部署扩展到大型、复杂的多数据中心架构。利用内存计算的优势，MongoDB能够提供高性能的数据读写操作。 

MongoDB 将数据存储为一个文档，数据结构由键值(key=>value)对组成。MongoDB 文档类似于 JSON 对象。字段值可以包含其他文档，数组及文档数组。

优点:
* Schema-less,不需要预先定义表结构,同一个“表”中可以保存多个格式的数据;
* 数据支持嵌套,数据以 json 格式存储;
* 允许使用 JavaScript 写服务端脚本,类似于存储过程;
* 支持 Map/Reduce;
* MongoDB 支持地理位置索引,可以直接用于位置距离计算和查询,实现“附近的人”、 “滴滴打车接单”等很容易;

缺点:
* 没有“数据一致性检查”、“事务”等,不适合存储对数据事务要求高(比如金融)的数据;只适合放非关键性数据(比如日志或者缓存)。
* 关联查询很弱,不适合做报表查询

## 2. 基本概念

SQL术语|MongoDB术语|说明
:-|:-|:-
database|database|数据库
table|collection|表/集合
row|document|数据记录行/文档
column|field|数据字段/域
index|index|索引
primary key|primary key|主键,MongoDB自动将_id字段设置为主键

* MongoDB的单个实例可以容纳多个独立的数据库。每一个都有自己的集合和权限，不同的数据库也放置在不同的文件中。
* 文档是一组键值(key-value)对(即 BSON)。MongoDB 的文档不需要设置相同的字段，并且相同的字段不需要相同的数据类型。文档中的键/值对是有序的。

> **ObjectId**

MongoDB 中存储的文档必须有一个 _id 键。这个键的值可以是任何类型的，默认是个 ObjectId 对象。

ObjectId 类似唯一主键，可以很快的去生成和排序，包含 12 bytes，含义是：
* 前 4 个字节表示创建 unix 时间戳(UTC)
* 接下来的 3 个字节是机器标识码
* 紧接的两个字节由进程 id 组成 PID
* 最后三个字节是随机数

![ObjectId结构组成](../img/nosql/objectid.jpg)

**ObjectId 中保存了创建的时间戳，所以文档中不需要保存时间戳字段**。可以通过 getTimestamp 函数来获取文档的创建时间。

```sh
> var newObject = ObjectId()
> newObject.getTimestamp()
ISODate("2017-11-25T07:21:10Z")
```

## 3. 安装
### 3.1 服务器
推荐使用Docker方式简单快速安装 [Mongo](https://hub.docker.com/_/mongo)。
```sh
# 获取镜像
docker pull mongo

# 创建并启动容器
docker run --name mongo -d -p 27017:27017 mongo

# 设置Username/Password
docker run --name mongo -d -p 27017:27017 \
    -e MONGO_INITDB_ROOT_USERNAME=colin \
    -e MONGO_INITDB_ROOT_PASSWORD=123123 \
    mongo
```
### 3.2 客户端
MongoDB 客户端有很多,有免费的、有收费的,这里推荐一个开源免费跨平台的MongoDB管理工具 [Robo 3T](https://robomongo.org/)

![Robo 3T](../img/nosql/robo3t.png)

## 4. Mongo连接
### 4.1 连接字符串
标准 URI 连接语法：
```
mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]
```
* mongodb:// 这是固定的格式，必须要指定。
* username:password@ 可选项，如果设置，在连接数据库服务器之后，驱动都会尝试登陆这个数据库
* host1 必须的指定至少一个host, host1 是这个URI唯一要填写的。它指定了要连接服务器的地址。如果要连接* 复制集，请指定多个主机地址。
* portX 可选的指定端口，如果不填，默认为27017
* /database 如果指定username:password@，连接并验证登陆指定数据库。若不指定，默认打开 test 数据库。
* ?options 是连接选项。如果不使用/database，则前面需要加上/。所有连接选项都是键值对name=value，键值对之间通过&或;（分号）隔开

常用连接字符串示例:
```sh
# 连接本地数据库服务器，端口是默认的。
mongodb://localhost

# 使用用户名colin，密码123123登录localhost的admin数据库。
mongodb://colin:123123@localhost
```

### 4.2 Mongo连接池
使用 MongoDB 时，可能会遇到因为 mongod 连接数用满了，导致客户端无法连接的问题。mongod的最大连接数通过 net.maxIncomingConnections 指定，默认值为1000000，相当于没有限制，**生产环境强烈建议根据实际需求配置，以避免客户端误用导致 mongod 负载过高。**

Mongod 的服务模型是每个网络连接由一个单独的线程来处理，每个线程配置了1MB 的栈空间，当网络连接数太多时，过多的线程会导致上下文切换开销变大，同时内存开销也会上涨。每个连接都要打开一个文件句柄，当然从成本上讲，这个消耗相对内存是小了很多。但换个角度，文件句柄也被其他模块消耗着，比如WT存储引擎，就需要消耗大量的文件句柄。链接数的上限需要综合考虑性能，稳定性，业务需求。多方面去考虑，缺一不可。

#### 1）Mongo Driver
MongoDB 各个语言的Driver 基本都会封装包含一个 MongoClient 的对象，通常应用在使用时构造一个全局 MongoClient，然后在后续的请求中使用该全局对象来发送请求给Mongo。

```csharp
// global MongoClient object
var mongoClient = new MongoClient("mongodb://localhost");

// request1
var mongo1 = mongoClient.getDatabase("db1").getCollection("col1");
mongo1.find({...})

// request2
var mongo2 = mongoClient.getDatabase("db2").getCollection("col2");
mongo2.update({...})
```

通常每个 MongoClient 会包含一个连接池，默认大小为100，也可以在连接字符串中通过 maxPoolSize 选项来指定。

一种典型的错误使用方式是，用户为每个请求都构造一个 MongoClient，请求结束释放 MongoClient（或根本没释放），这样做问题是请求模型从长连接变成了短连接，每次短连接都会增加“建立 tcp 连接 + mongodb鉴权”的开销，并且并发的请求数会受限于连接数限制，极大的影响性能；另外如果 MongoClient 忘记释放，会导致MongoClient 连接池里连接一直保持着，最终耗光所有的可用连接。

```csharp
//错误示范

// request1
var mongoClient1 = new MongoClient("mongodb://localhost");
var mongo1 = mongoClient1.getDatabase("db1").getCollection("col1");
mongo1.find({...})

// request2
var mongoClient2 = new MongoClient("mongodb://localhost");
var mongo2 = mongoClient1.getDatabase("db2").getCollection("col2");
mongo2.update({...})
```

#### 2）连接池配置

通常 MongoClient 使用默认100的连接池都没问题，当访问同一个 Mongo 的源比较多时，则需要合理的规划连接池大小。

举个例子，Mongo 的连接数限制为2000，应用业务上有40个服务进程可能同时访问 这个Mongod，这时每个进程里的 MongoClient 的连接数则应该限制在 2000 / 40 = 50 以下 （连接复制集时，MongoClient 还要跟复制集的每个成员建立一条连接，用于监控复制集后端角色的变化情况）。


## 5. CRUD
MongoDb提供了各种开发环境的驱动，这里我们以.NET平台为例。我们使用官方提供的驱动包`MongoDB.Driver`。目前版本为2.8.0，支持`.NETStandard 1.5`。

```sh
dotnet add package MongoDB.Driver
```

关于`MongoDB.Driver`详细的使用方式，可参阅官方文档 https://docs.mongodb.com/ecosystem/drivers/csharp/
### 5.1 初始化
```csharp
//连接到mongo服务器
var client = new MongoClient("mongodb://localhost");
//获取指定数据库，如果不存在则创建
var database = client.GetDatabase("test");
//获取集合(类似"表"),如果不存在则创建
var persons = database.GetCollection<Person>("persons");
```

### 5.2 Filter
MongoDB.Driver中通过 Filter 对象进行数据过滤,其类型为 FilterDefinition&lt;TDocument&gt;。可以通过 Builders&ltT&gt.Filter 的诸多方法创建过滤器，如 Builders&lt;Person&gt;.Filter.Gt(p => p.Age,5)

常用过滤条件除了`Gt`还有诸如`Gte、In、Lt、Lte、Ne、Nin、Near、NearSphere、Or、Where、And、Not`等。最强大的是`Where`，它可以做复合条件筛选，如 Builders&lt;Person&gt;.Filter.Where(p => p.Age >= 5 && p.Gender == "Male")。

**`BsonDocument`对象不会过滤任何数据，常用于条件查询中。** 
```csharp
// 筛选出所有女性和成年男性
var filter = Gender == "Male"
    ? Builders<T>.Filter.Gt(p => p.Age >= 18)
    : new BsonDocument();
```

数据查询、修改和删除操作常需要配合过滤器使用。

### 5.3 插入数据
```csharp
//单条数据(document)插入
await persons.InsertOneAsync(new Person(1, "Colin", 18));

var ps = new Person[]
{
    new Person(2, "Robin", 20),
    new Person(3, "Sean", 23)
};
//批量数据插入
await persons.InsertManyAsync(ps);
```

MongoDB 默认用 id 做主键,因此不用显式指定 id 是主键。MongoDB 中没有内置“自增字段”，如果插入对象没有Id属性或者把 Id 声明为`ObjectId`类型这样插入以后自动给字段赋值。

![mongo数据格式](../img/nosql/mongo.jpg)

```csharp
//json数据插入
var persons = database.GetCollection<BsonDocument>("persons");
persons.InsertOne(BsonDocument.Parse("{Name:'Colin',Age:18}"));
persons.InsertOne(BsonDocument.Parse("{Name:'Colin',Age:18,Gender:0}"));
```

MongoDB 是用 json 保存的,因此也可以直接以 json 格式插入,用 `BsonDocument` 来代表,如果使用`BsonDocument`类型来代表数据类型，那获取Collection时也必须使用相同类型。Json是松散的数据结构，可以有任意不同字段，不像关系表中数据字段必须一致。

### 5.4 删除数据
```csharp
//删除数据库
await client.DropDatabaseAsync("test");

//数据Collection
await client.DropCollectionAsync("persons");

//数据Document
var filter = Builders<Person>.Filter.Where(p => p.Age >= 18);//删除年龄大于18的所有人
await persons.DeleteManyAsync(filter)
```

### 5.5 更新数据
```csharp
var filter = Builders<Person>.Filter.Where(p => p.Age <= 5);
var update = Builders<Person>.Update.Set(p=>p.Age,8);
persons.UpdateMany(filter, update);
```

### 5.6 查询数据
1) Count

```csharp
//统计成年人总数
var filter = Builders<Person>.Filter.Gt(p => p.Age >= 18);
var count = await persons.CountDocumentsAsync(filter);
```

2）Where
```csharp
//查询成年男性
var filter = Builders<Person>.Filter.Where(p => p.Age >= 18 && p.Gender == "Male");
using (var cursor = await persons.FindAsync<Person>(filter))
{
    while (cursor.MoveNext())
    {
        var ps = cursor.Current;
        foreach (var p in ps)
            Console.WriteLine(p.Name)
    }
}
```
`FindAsync` 不直接返回集合,而是要 `MoveNext` 之后返回一个集合呢。因为查询的数据量可能很大,因此 MongoDB 是分批下载,下载一批之后执行 `GET_More` 操作返回下一批。可以通过 `FindOptions` 参数的 `BatchSize` 设置每一批的大小。

如果确认返回的数据量不大,可以 `var ps = await personsCursor.ToListAsync()` (或 `ToEnumerable()`)一次返回所有数据。

3) Sort
```csharp
var findOpt = new FindOptions<Person, Person>();
findOpt.Sort = Builders<Person>.Sort.Ascending(p => p.Age).Descending(p => p.Name);//年龄生序，姓名降序
//查询所有人并按照以上规则排序
await persons.FindAsync(new BsonDocument(), findOpt);
```

4）分页
```csharp
var findOpt = new FindOptions<Person, Person>();
findOpt.Skip = 10;//跳过10条
findOpt.Limit = 10;//取10条
await persons.FindAsync(new BsonDocument(), findOpt);
```

### 5.7 MongoHelper
仿照关系型数据库中`SqlHelper`,我们可以将对Mongo的常用操作封装到一个`MongoHelper`中。

源码和使用方式已上传至Github: https://github.com/colin-chang/mongohelper

## 6. Mongo优化
### 6.1 优化设计原则
* 使用默认_id键。
文档中的_id键推荐使用默认值，而不是中保存自定义的值。MongoDB在指定_id与不指定_id插入时速度相差很大，指定_id会减慢插入的速率。
* 限制查询结果的数目以减少网络需求。
MongoDB cursors 以多个文档为一组返回结果。如果你知道你想要的结果数目，你就可以使用 limit() 方法来减少对网络资源的需求。如:
```sql
db.posts.find().sort( { timestamp : -1 } ).limit(10)
```
* 使用映射只返回需要的数据
当你仅仅需要文档字段的子集，你可以通过只返回你需要的字段来获取更好的性能。如果对于 posts 集合的查询只需要 timestamp， title， author 字段，可以使用如下命令:
```sql
db.posts.find( {}, { timestamp : 1 , title : 1 , author : 1 } )
```
* 大批量插入优化。批量插入（batchInsert）可以减少数据向服务器的提交次数，提高性能。但是批量提交的BSON Size不超过48MB。
* 禁止一次取出太多的数据进行排序，MongoDB目前支持对32M以内的结果集进行排序。如果需要排序，请尽量限制结果集中的数据量。
* 合理使用索引。MongoDB索引可以提高文档的查询、更新、删除、排序操作，所以结合业务需求，适当创建索引。每个索引都会占用一些空间，并且导致插入操作的资源消耗,建议每个集合的索引数尽量控制在5个以内。

### 6.2 索引
#### 1) 简单索引
与关系型数据库类似，Mongo也支持，基础索引、组合索引、唯一性索引。**复合索引的键值顺序使用最左前缀原则。** 如在test集合上创建组合索引`{a:1,b:1,c:1}`。执行以下7个查询语句:
```sql
db.test.find({a:”hello”})                       // 1
db.test.find({b:”sogo”, a:”hello”})             // 2
db.test.find({a:”hello”,b:”sogo”, c:”666”})     // 3
db.test.find({c:”666”, a:”hello”})              // 4
db.test.find({b:”sogo”, c:”666”})               // 5
db.test.find({b:”sogo” })                       // 6
db.test.find({c:”666”})                         // 7
```
**查询应包含最左索引字段(`a`)，以索引创建顺序为准，与查询字段顺序无关。**以上查询语句可能走索引的是1、2、3、4。

#### 2）文档索引
```sql
db.factories.insert( { name: "wwl", addr: { city: "Beijing", state: "BJ" } } );
//在addr 列上创建索引
db.factories.ensureIndex( { addr : 1 } );
//下面这个查询将会用到我们刚刚建立的索引
db.factories.find( { addr: { city: "Beijing", state: "BJ" } } );
//但是下面这个查询将不会用到索引，因为查询的顺序跟索引建立的顺序不一样
db.factories.find( { addr: { state: "BJ" , city: "Beijing"} } );
```
#### 3) TTL 索引
TTL 索引（time-to-live index，具有生命周期的索引），使用TTL索引可以将超时时间的文档老化，一个文档到达老化的程度之后就会被删除。创建TTL的索引必须是日期类型。TTL索引是一种单字段索引，不能是复合索引。TTL删除文档后台线程每60s移除失效文档。不支持定长集合。

#### 4) 稀疏索引
需要在集合中某字段创建索引，但集合中大量的文档不包含此键值时，建议创建稀疏索引。索引默认是密集型的，这意味着，即使文档的索引字段缺失，在索引中也存在着一个对应关系。在稀疏索引中，只有包含了索引键值的文档才会出现。

#### 5) 文本索引
创建文本索引时字段指定text，而不是1或者-1。每个集合只有一个文本索引，但是它可以为任意多个字段建立索引。文本搜索速度快很多，**推荐使用文本索引替代对集合文档的多字段的低效查询**。


> 参考文档
* https://www.cnblogs.com/williamjie/p/9305807.html
* http://www.cnblogs.com/crazylights/archive/2013/05/08/3066056.html
* http://www.runoob.com/mongodb/mongodb-query.html
* http://www.mongoing.com/docs/tutorial/optimize-query-performance-with-indexes-and-projections.html
* https://blog.fundebug.com/2018/09/19/18-principle-to-improve-mongodb-performance/