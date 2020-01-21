# MongoDB

## 1. Mongo 基础
### 1.1 Mongo
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

### 1.2 基本概念

SQL术语|MongoDB术语|说明
:-|:-|:-
database|database|数据库
table|collection|表/集合
row|document|数据记录行/文档
column|field|数据字段/域
index|index|索引
primary key|primary key|主键,MongoDB自动将_id字段设置为主键

* MongoDB的单个实例可以容纳多个独立的数据库。每一个都有自己的集合和权限，不同的数据库也放置在不同的文件中。
* document 是一组键值(key-value)称为BSON(Json的一种扩展)。
* document 可以设置不同的字段
* 相同的字段可以使用不同的数据类型。
* document 键/值对是有序的。

## 2. Mongo 安装
推荐使用Docker方式简单快速安装 [Mongo](https://hub.docker.com/_/mongo)。
```sh
docker run \
-d \
--name mongo \
-p 27017:27017 \
-e MONGO_INITDB_ROOT_USERNAME=user \
-e MONGO_INITDB_ROOT_PASSWORD=password \
mongo:4
```

在安装Mongo时会同时安装服务端和客户端。服务端命令为`mongod`,客户端命令为`mongo`。使用客户端连接Redis服务之后可以在shell中执行Redis命令。

```sh
# 连接本地MongoDB服务器
mongo --port 27017 -u colin -p 123123 --authenticationDatabase admin

# 执行mongo shell命令
db
show dbs
use db_test
db.students.find()
```

除了使用Mongo提供的命令行客户端，我们也可以使用第三方GUI客户端，如如Navicat,[Robo 3T](https://robomongo.org/)等。一般客户端软件都提供了Mongo Shell。

![Robo 3T](https://s2.ax1x.com/2020/01/21/1FuZTg.png)

## 3. Mongo 数据类型
数据类型|说明
:-|:-
Object ID|文档ID
String|字符串，最常用，必须是有效的UTF-8
Boolean|存储一个布尔值，true或false
Integer|整数可以是32位或64位，这取决于服务器
Double|存储浮点值
Arrays|数组或列表，多个值存储到一个键
Object|用于嵌入式的文档，即一个值为一个文档
Null|存储Null值
Timestamp|时间戳
Date|存储当前日期或时间的UNIX时间格式

::: tip ObjectId
MongoDB 中存储的文档必须有一个 `_id` 键。这个键的值可以是任何类型的，默认是个`ObjectId`对象。
:::
`ObjectId`类似唯一主键，可以很快的去生成和排序，包含12B，其含义如下：
* 前四个字节表示创建 unix 时间戳(UTC)
* 接下来的三个字节是机器标识码
* 紧接的两个字节为PID
* 最后三个字节是随机数

![ObjectId结构组成](https://s2.ax1x.com/2020/01/21/1FuPSI.jpg)

**ObjectId 中保存了创建的时间戳，所以文档中不需要保存时间戳字段**。可以使用`getTimestamp()`来获取时间。

```js
var objId = ObjectId()
objId.getTimestamp()  // 2019-08-30 09:12:48.000
```

## 4. Mongo Shell
mongo shell是MongoDB的一个组件,它是MongoDB的一个交互式的JavaScript接口，支持JavaScript部分语法，如`if/for`等流控制语句和`function`等。用户能够通过mongo shell执行查询、更新数据等操作。

### 4.1 数据库操作
```js
// 查看当前数据库
db

// 查看所有数据库
show dbs

// 切换数据库.如果数据库不存在，则指向数据库，但不创建
// use db
use db_test

// 删除当前数据库,如果数据库不存在，则什么也不做
db.dropDatabase()
```
### 4.2 集合操作
```js
/* 新建 Collection
* db.createCollection(name[,options])
* name是要创建的集合的名称
* options是一个文档，用于指定集合的配置
	* 参数capped：默认值为false表示不设置上限，值为true表示设置上限
	* 参数size(byte)：当capped值为true时，需要指定此参数，表示集合文件尺寸上限，当文档达到上限时，插入新数据时会首先删除旧数据(优先删除时间最早的数据)
    * 参数max(document count):表示集合document条数上限，超过上限后，插入新数据时会首先删除旧数据(优先删除时间最早的数据)
*/
db.createCollection('students')
db.createCollection('classes',{capped:true,size:100,max:10}) // documents超过100B或条数超过10条时会插入数据时会删除最旧的数据

// 查看当前db中所有集合
show collections

// 删除指定名称的集合
//db.collection.drop()
db.students.drop()
```

### 4.3 数据操作
```js
/* 插入
* 单条 db.collection.insert(document)
* 批量 db.collection.insertMany(document)
*/
db.students.insert({name:'Jerry',age:18,courses:['Chinee','Math','English']})
db.students.insertMany([{name:'Colin'},{name:'Robin'}])

/* 删除
* db.students.remove([query,options])
* 参数query:必须(可为空)，删除的文档的条件
* 参数justOne:可选，true或1，只删一条，默认false，表示删除多条
*/
db.students.remove({})//删除所有学生
db.students.remove({age:18})//删除所有18岁的学生
db.students.remove({gender:true},{justOne:true})//删除一个男生

/* 更新 
* db.collection.update(query, update, options)
* 参数query:更新条件。{}表示匹配所有
* 参数update:更新内容。如果更新字段不存在则会扩展为新字段。使用$set仅更新指定字段，否则将直接替换掉整条document。
* 参数multi:可选。false(默认)表示只更新一条记录，true表示更新满足条件的全部文档
*/
db.students.update({name:'Colin'},{age:18}) // 将name为'Colin'的第一条document直接替换为全新的document，内容为{age:18}
db.students.update({name:'Robin'},{$set:{age:18}}) // 将name为'Robin'的第一条document的age字段更新为18
db.students.update({},{$set:{grade:1}},{multi:true}) // 将所有学生grade更新为1

// 保存。如_id存在则替换document，否则新增document
db.students.save({name:'Tom'}) // 新增document
db.students.save({_id:ObjectId('5d6900e9ef09a93934746879'),age:20}) //替换现有document 
```

### 4.4 数据查询
#### 4.4.1 简单查询
```js
/* 查询
* db.collection.find(query, projection) 查询全部document
* db.students.findOne(query, projection) 仅查询一个document
* 参数query:查询条件。不提供此项或{}表示匹配所有
* 参数projection:投影字段。不提供此项则投影全部字段。设置此项时，1表示显示，0或不设置(_id除外)表示不显示。对于_id列默认是显示的，如果不显示需要明确设置为0
*/
db.students.find() // 查询所有学生所有字段
db.students.find({gender:true},{_id:0,name:1,age:1}) // 查询所有男生姓名和年龄
db.students.find({'grades.English':{$gt:120}}) // 查询英语成绩(二级字段)120分以上的学生。
```
#### 1) 比较运算符

功能|运算符
:-|:-
等于|默认运算，使用Json的`:`
不等于|`$ne`
小于|`$lt`
大于|`$gt`
小于等于|`$lte`
大于等于|`$gte`

```js
db.students.find({age:{$gt:18}}) // 查询成年学生信息
```

#### 2) 范围运算符
使用`$in`，`$nin` 判断是否在某个范围内。

```js
db.students.find({age:{$in:[18,20]}}) // 查询年龄为18或20岁的学生
```

#### 3) exists
查询存在指定字段的数据。
```js
db.students.find({phone_no:{$exists:1}}) // 查询有手机号的学生信息
```

#### 3) 逻辑运算符
* 逻辑与。使用Json声明多个字段即表示逻辑与，或者可以使用`$and`
* 逻辑或。`$or`
* 取反。`$not`

```js
db.students.find({age:{$gte:18},gender:true}) // 查询成年男生信息
db.students.find({$or:[{gender:0},{age:{$gte:18}}]}) // 查询女生或成年学生信息
```

#### 4) 正则匹配
使用`//`或`$regex`编写正则表达式
```js
db.students.find({name:/^C/}) // 查询名字以C开头的学生
db.students.find({name:{$regex:'^C'}}) // 查询名字以C开头的学生
```

#### 5) 自定义函数
mongo shell支持使用`$where`后面写一个函数自定义JavaScript函数作为查询过滤条件。**对于复杂的查询条件，这一功能异常强大实用,甚至可以替代以上所有所有查询过滤运算符**。

```js
// 查询20~25岁的男生
db.students.find({$where:function(){return this.age>=20 && this.age<=25 && this.gender==true}})
```
#### 4.4.2 skip/limit
`skip(m)`表示跳过m条记录，`limit(n)`表示取n条记录。两者行组合使用，用分页等厂场景。
```js
db.students.find().skip(4).limit(2) // 跳过4条取2条数据
```

#### 4.4.2 sort
`sort()`，用于对结果集进行排序。1表示升序，-1表示降序。

```js
db.students.find().sort({age:1,name:-1}) // 查询所有学生并按年龄升序，姓名降序排列
```

#### 4.4.3 count
`count()`用于统计结果集中文档条数。`count()`可以配合`find()`使用，也可以单独使用。

```js
db.students.find({gender:true}).count() // 统计男生人数

db.students.count({gender:true}) // 统计男生人数
```

#### 4.4.4 distinct
`distinct()`用于对数据进行去重。
```js
// 数据去重
// db.collection.distinct(field, query)
db.students.distinct('name',{age:{$gte:18}}) //查询成年学生不重复的名字
```

### 4.5 aggregate
`aggregate()`可以利用管道聚合多种高级查询策略。`aggregate()`的参数为一个数组，每一项是一个管道，首先将管道函数作用于数据，完成后将整体结果作为参数传递给下一个管道，类似于`Unix/Linux`命令中管道(`|`)的作用。

```js
db.collection.aggregate([{pipeline:{expression}}])
```

`aggregate()`不能和`find()/sort()/skip()/limit()`等函数一起使用，所以管道提供了这些函数的管道版本实现。一般情况下，**这些管道函数最终会与`$group`一起使用完成聚合，否则可以选择非管道的普通函数实现更为简单。**

下面我们列举的只是常用的部分管道，基本可以覆盖常见查询。如需处理更为复杂的场景，可以参阅[官方文档](https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline/)，MongoDB提供了足够覆盖几乎所有场景的更多复杂且功能强大的管道。

常用管道|作用
:-|:-
`$match`|过滤数据，只输出符合条件的文档
`$project`|投影字段，修改输出文档结构，如重命名、增加、删除字段等
`$sort`|将输入文档排序后输出
`$skip`|跳过指定数量的文档，并返回余下的文档
`$limit`|限制聚合管道返回的文档数
`$group`|将集合中的文档分组，可用于统计结果
`$unwind`|将数组类型的字段拆分为多条文档



#### 4.5.1 $match/$project
`$match`是用于过滤数据，只输出符合条件的文档。`$project`则用于投影选定字段。两者组合使用相当于`find(query,projection)`的管道版实现。


```js
// 查询成年学生的名字和年龄
db.students.aggregate([
    {$match:{age:{$gte:18}}},
    {$project:{_id:0,name:1,age:1}}
])

// 非管道实现
db.students.find({age:{$gte:18}},{_id:0,name:1,age:1})
```

`$project`可以进行复杂的字段投影控制，还可以重命名字段。
```js
db.students.aggregate([{
    $project: {
        // 投影字段
        age:0,//投影顶级字段
        'grades.Math': 0,//投影二级字段
    },
    $project:{first_name:'$name'} //重命名字段
}])
```

#### 4.5.2 $skip/$limit
`$skip/$limit`是`skip()/limit()`的管道版实现。
```js
// 取第5-6条学生信息
db.students.aggregate([
    {$skip:4},
    {$limit:2}
])

// 非管道实现
db.students.find().skip(2).limit(2)
```
#### 4.5.3 $sort
`$sort`是`sort()`的管道版实现。
```js
// 查询学生信息以年龄升序，名字降序排列
db.students.aggregate([{$sort:{age:1,name:-1}}])

// 非管道实现
db.students.find().sort({age:1,name:-1})
```

#### 4.5.4 $group
`$group`用于将集合中的文档进行分组聚合统计。

* `_id`表示分组的key，**`_id : null` 表示所有数据分为一组，也可以认为不分组**。
* 字段使用格式为`'$filed'`。分组中除`_id`往外，每个字段必须为聚合表达式
* `$group`提供了以下常用的分组统计聚合表达式。

    分组表达式|作用
    :-|:-
    `$sum`|计算总和。`$sum:1`等同于`count`
    `$avg`|计算平均值
    `$min`|获取最小值
    `$max`|获取最大值
    `$first`|根据资源文档的排序获取第一个文档数据
    `$last`|根据资源文档的排序获取最后一个文档数据
    `$push`|按组将特定字段拼接为一个数组字段。`$$ROOT`表示所有字段。类似于MySql的`GROUP_CONCAT`。

```js
// 统计成年男女生各自人数和平均年龄，以及各组成员的名字列表
db.students.aggregate([
    {$match: {age: {$gte: 18}}},
    {$group: {
            _id: '$gender',
            total: {$sum: 1},
            avg_age: {$avg: '$age'},
            names: {$push: '$name'}
        }
    }
])

/* 以下为查询结果
{
    "_id": true,
    "total": 4,
    "avg_age": 24.5,
    "names": ["Colin","Sean","Ted","Barney"]
}
{
    "_id": false,
    "total": 4,
    "avg_age": 21.75,
    "names": ["Robin","Lily","Penny","Lily"]
}
*/
```

`$push`中如果要查询全部字段，可以使用`$$ROOT`代替字段名称。MongoDB作为非关系型数据库可以在分组查询时将各分组的成员列表以嵌套Json的格式查询出来，关系型数据库则无法实现这一点，这也体现了非关系型数据库的灵活性。

```js
// 查询男女生各自成员列表全部信息
db.students.aggregate([{
    $group: {
        _id: '$gender',
        memebers: {$push: '$$ROOT'}
    }
}])

/* 以下为查询结果
{
    "_id": true,
    "memebers": [
        {
            "_id": ObjectId("5d69753fe8929845fe389355"),
            "name": "Colin",
            "age": 18,
            "gender": true
        },
        ...
    ]
}
{
    "_id": false,
    "memebers": [
        {
            "_id": ObjectId("5d69753fe8929845fe389356"),
            "name": "Robin",
            "age": 20,
            "gender": false
        },
        ...
    ]
}
*/
```

#### 4.5.5 $unwind
`$unwind`可以将文档中的某一个数组类型字段拆分成多条，每条包含数组中的一个值，这在处理数组字段时非常有用。

```js
/* 假定有集合 areas 数据如下：
[
    {
        "province": "北京",
        "cities": [
            {"name": "北京","GDP": 30300}
        ]
    },
    {
        "province": "山东",
        "cities": [
            {"name": "青岛","GDP": 12001},
            {"name": "泰安","GDP": 3651}
        ]
    }
]
*/

//我们可以利用 $unwind 将上面的省市信息按城市拆分后平铺数据
db.areas.aggregate([
	{$unwind:'$cities'},
	{$project:{_id:0,province:1,city:'$cities'}}
])

/*拆分结果如下：
{
    "province": "北京",
    "city": {"name": "北京","GDP": 30300}
}
{
    "province": "山东",
    "city": {"name": "青岛","GDP": 12001}
}
{
    "province": "山东",
    "city": {"name": "泰安","GDP": 3651}
}
*/
```
拆分字段为空数组、非数组、无字段、null情况下，文档会被自动忽略，如果要包含以上这些情况的文档，需要声明`preserveNullAndEmptyArrays:true`。
```js
db.areas.aggregate([{
    $unwind: {
        path: '$cities',
        preserveNullAndEmptyArrays: true
    }
}])
```

`$unwind`是`$group`的逆操作，前者拆分数据，后者聚合数据。在查询有复杂的数组字段的文档时，可以先使用`$unwind`将文档按数组字段拆分平铺数据，然后丢给下个管道执行过滤等任意操作，最后丢给`$group`再将结果聚合，这也体现出在复杂场景下`aggregate()`聚合多种管道的强大之处。

```js
/* 现有 areas 集合有如下数据。
* 要求查询出有万亿GDP城市的省份及上榜城市列表，就需要使用多组聚合函数来配合完成
[
    {
        "_id": ObjectId("5d6a95d1e8929845fe389366"),
        "province": "北京",
        "cities": [{"name": "北京","GDP": 30300}]
    },
    {
        "_id": ObjectId("5d6a95d1e8929845fe389367"),
        "province": "山东",
        "cities": [
            {"name": "青岛","GDP": 12001},
            {"name": "泰安","GDP": 3651}
        ]
    },
    {
        "_id": ObjectId("5d6abd5ee8929845fe389371"),
        "province": "江苏",
        "cities": [
            {"name": "苏州","GDP": 18597},
            {"name": "南京","GDP": 12820},
            {"name": "南通","GDP": 8427}
        ]
    }
]
*/

// 查询有万亿GDP的省和上榜城市
db.areas.aggregate([
	{$unwind:'$cities'},// 按城市拆分
	{$match:{'cities.GDP':{$gte:10000}}}, // 过滤GDP数据
	{$group:{_id:'$_id',province:{$first:'$province'},cities:{$push:'$cities'}}} // 聚合查询结果
])
```

## 5. 索引
与关系型数据库类似，MongoDB也支持使用 [索引](https://docs.mongodb.com/manual/indexes/index.html) 提升查询性能。MongoDB在`_id(ObjectId)`字段上默认建立了索引。

### 5.1 创建/删除 索引
```js
// 创建索引
// db.collection.createIndex( <key and index type specification>, <options> )
db.students.createIndex( { name: -1 } ) // 为name字段建立降序索引

// 查看索引
db.students.getIndexes()
```

默认索引名字格式为`indexkey_direction`。如索引`{ item : 1, quantity: -1 }`默认名称为`item_1_quantity_-1`。如有必要也可以使用以下方式自定义索引名称。

```js
// 自定义索引名称
db.students.createIndex(
  { name: 1, age: -1 } ,
  { name: "name_age_index" }
)
```
索引一旦建立后名称不可修改，只能删除后重建索引。

```js
// 删除索引
db.students.dropIndex('name_age_index')
```

### 5.2 索引类型
#### 5.2.1 Single Field
[Single Field](https://docs.mongodb.com/manual/core/index-single/) 为单字段索引，索引单字段时索引的排序规则不再重要，MongoDB可以任意方向检索索引字段。

```js
db.students.createIndex({name:1}) // Single Field
db.areas.createIndex({"cities.GDP"}) // 嵌入式字段索引
```

#### 5.2.2 Compound Index
[Compound Index](https://docs.mongodb.com/manual/core/index-compound/) 为复合索引。

```js
db.test.createIndex({a:1,b:1,c:1})
```

**复合索引的键值顺序使用最左前缀原则。** 如上面创建的索引，执行以下7个查询语句，只有 1、2、3、4 会走索引。
```sql
db.test.find({a:'hello'})                       // 1
db.test.find({b:'sogo', a:'hello'})             // 2
db.test.find({a:'hello',b:'sogo', c:'666'})     // 3
db.test.find({c:'666', a:'hello'})              // 4
db.test.find({b:'sogo', c:'666'})               // 5
db.test.find({b:'sogo' })                       // 6
db.test.find({c:'666'})                         // 7
```
**查询应包含最左索引字段(`a`)，以索引创建顺序为准，与查询字段顺序无关。**

#### 5.2.2 Multikey Index
MongoDB使用 [Multikey Index](https://docs.mongodb.com/manual/core/index-multikey/) 索引数组字段。**当我们索引一个数组字段时，MongoDB会自动拆分数组字段进行索引,而不需要开发者干预**。查询数组字段或数据内部字段时`Multikey Index`都会被使用。

#### 5.2.3 Text Indexes
[Text Indexs](https://docs.mongodb.com/manual/core/index-text/) 为全文索引，支持索引文本内容。全文索引可以索引含有文本内容或文本内容数组的字段。

::: warning
 一个集合最多只能有一个全文索引。
:::

```js
// 为文章集合评论字段创建全文索引
db.articls.createIndex({comments:'text'})

// 全文索引多个字段
db.articls.createIndex({content:'text',comments:'text'})
```

### 5.3 索引属性
#### 5.3.1 Unique Indexes
唯一性索引要求索引字段内容不重复。

```js
db.students.createIndex({name:1},{unique:true}) //单字段唯一索引
db.students.createIndex({name:1,age:-1},{unique:true}) // 多字段唯一索引
```

#### 5.3.2 Partial Indexes
部分索引仅索引满足过滤条件的文档。常用过滤条件如下：
* $exists
* $gt, $gte, $lt, $lte 
* $type expressions
* $and

```js
// 索引成年学生的name和gener字段
db.students.createIndex(
   { name: 1, gender: 1 },
   { partialFilterExpression: { age: { $gte: 18 } } }
)
```

#### 5.3.3 Sparse Indexes
稀疏索引仅索引包含索引字段的文档。可以`unique`组合使用。

```js
// 索引学生手机号字段(自动排除没有手机号字段的文档)
db.students.createIndex( { "phone_number": 1 }, { sparse: true } )
```

#### 5.3.4 TTL Indexes
TTL(time to live)索引会在指定的超时时间后自动删除文档。常用于日志类集合，如设置日志保存一个月后自动删除。

```js
// 设置logs表文档超时时间为1小时。从文档被创建时计时。
db.logs.createIndex( { "createdAt": 1 }, { expireAfterSeconds: 3600 } )
```

指定过期时间除了可以设定有效秒数，也可以指定一个明确过期时间。
```js
db.logs.createIndex( { "expireAt": 1 }, { expireAfterSeconds: 0 } )

// 该文档会在 2020-07-01 00:00:00 被自动删除
db.logs.insert( {
   "expireAt": new Date('July 1, 2020 00:00:00'),
   "logEvent": 2,
   "logMessage": "Success!"
} )
```

### 5.4 查询性能分析
mongo shell提供了 `db.collection.explain()` 用于[分析查询性能](https://docs.mongodb.com/manual/tutorial/analyze-query-plan/)。

它目前支持对以下函数进行性能分析。
* `aggregate()`
* `count()`
* `find()`
* `remove()`
* `update()`
* `distinct()`
* `findAndModify()`

```js {1,9}
db.test.explain('executionStats').find({value:999999})

/* 以下为截取的分析结果，我们可以看到查询语句的执行耗时时间(ms)。
{
    ...
    "executionStats": {
        "executionSuccess": true,
        "nReturned": NumberInt("1"),
        "executionTimeMillis": NumberInt("545"),
        "totalKeysExamined": NumberInt("0"),
        "totalDocsExamined": NumberInt("1000001"),
        ...
    }
    ...
}
*/
```
`explain()`可以用于性能优化，如分析建立某个字段索引前后的性能差异等。

## 6. 安全管理
### 6.1 备份与恢复
```js
// 备份数据库
// mongodump -h host -p port -d database -o output
mongodump -h 192.168.0.200 -d db_test -o ~/mongobak

// 恢复数据库
//mongorestore -h host -p port -d database --dir input_directory
mongorestore -h 192.168.0.200 -d db_test --dir ~/mongobak
```
### 6.2 权限管理
MongoDB 使用 `role-user-database` 方式管理数据库权限。

```sql
show roles  // 查看所有角色
show users  // 查看所有用户
show dbs    // 查看所有数据库
```

常用系统角色|说明
:-|:-
`root`|超级管理员，默认数据库为`admin`
`read`|允许用户读取指定数据库
`readWrite`|允许用户读写指定数据库

#### 6.2.1 创建管理员
```js
use admin
db.createUser({
    user:'admin',
    pwd:'123',
    roles:[{role:'root',db:'admin'}]
})
```

#### 6.2.2 启用安全验证
```sh
# 修改配置文件。不同平台下配置文件路径可能不同
sudo vi /etc/mongo/mongod.conf 

# 添加以下内容。
security:
  authorization: enabled # 注意保留空格

# 重启mongod
sudo service mongod restart
```

#### 6.2.3 创建普通用户
```js
// 登录 admin
mongo -u admin -p 123 --authenticationDatabase admin

// 创建普通用户
db.createUser({
    user:'colin',
    pwd:'123',
    roles:[{role:'readWrite',db:'db_test'}]
})

```
至此，即可使用`colin`登录，该用户有对`db_test`读写权限。

#### 6.2.4 修改用户信息
```js
// 修改用户密码和角色
db.updateUser('colin', {
    pwd: '123123',
    roles: [{
        role: 'root',
        db: 'admin'
    }]
})
```

::: warning Mongo in Docker
使用docker容器运行 MongoDB ，创建容器时如果指定了用户名密码则意味着已经开启了安全验证，可以直接管理普通用户。
:::

## 7. Mongo 集群
### 7.1 副本集
MongoDB支持多复本集群，集群可以实现故障自动迁移。故障时可以实现主从复本自动切换，故障恢复后可以实现数据自动恢复，确保服务高可用。

需要注意的是至少有三个复本才能实现故障时主动自动切换。Master复本可读可写,Slave复本只读。主从复本可以自动进行数据同步。 

### 7.2 集群搭建
下面我们来演示一下使用 docker-compose 快速搭建一个一主二从的集群。

> [mongo-cluster-docker](https://github.com/senssei/mongo-cluster-docker)

#### 1) 启动服务集群
三个mongo服务需要设置相同的`--replSet`选项即集群名称，这里设置集群名称为`rs_test`。
```yml
version: '3.7'

services:
  mongo1:
    image: mongo
    container_name: mongo1
    ports:
      - "27017:27017"
    restart: always
    command: mongod --replSet rs_test
    networks:
      - mongo-cluster

  mongo2:
    image: mongo
    container_name: mongo2
    ports:
      - "27018:27017"
    restart: always
    command: mongod --replSet rs_test
    networks:
      - mongo-cluster

  mongo3:
    image: mongo
    container_name: mongo3
    ports:
      - "27019:27017"
    restart: always
    command: mongod --replSet rs_test
    networks:
      - mongo-cluster

networks:
  mongo-cluster:
    driver: bridge
```


```sh
docker-compose up --build  # 启动服务集群
```

#### 2) 初始化主从配置
第一次启动集群后需要进行主从初始化配置。

通过任意客户端连接`master`和`slave`分别进行以下配置。

```js
// master 配置
config = {
    "_id" : "rs_test",
    "members" : [
        {"_id" : 0,"host" : "mongo1:27017"},
        {"_id" : 1,"host" : "mongo2:27017"},
        {"_id" : 2,"host" : "mongo3:27017"},
    ]
}

rs.initiate(config)

// slave 配置
rs.slaveOk()
```

如果没有安装客户端可以直接使用容器内`mongo`客户端,假如我们选择`mongo1`为`master`。
```sh
# 打开mongo1 客户端
docker exec -it mongo1 mongo

## 在此 执行上面的 master 配置即可
```

以上配置只是初始化配置(仅第一次)，如果之后集群Master复本发生故障，会自动选举新的Master实现主从自动切换。

#### 3) 集群维护
```js
rs.add('192.168.0.200:27020')  // 添加复本

rs.remove('192.168.0.200:27020')  // 删除复本
```

## 8. 应用程序交互
MongoDB 为各开发平台提供的对应Driver，用法类似。下面我们以.NET平台为例，使用官方提供的驱动包 [MongoDB.Driver](https://www.nuget.org/packages/MongoDB.Driver/)。目前版本为2.8.0，支持`.NETStandard 1.5`。

> [官方文档](https://docs.mongodb.com/ecosystem/drivers/csharp/)

### 8.1 连接字符串
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

### 8.2 Mongo 连接池
使用 MongoDB 时，可能会遇到因为 mongod 连接数用满了，导致客户端无法连接的问题。mongod的最大连接数通过 net.maxIncomingConnections 指定，默认值为1000000，相当于没有限制，**生产环境强烈建议根据实际需求配置，以避免客户端误用导致 mongod 负载过高。**

Mongod 的服务模型是每个网络连接由一个单独的线程来处理，每个线程配置了1MB 的栈空间，当网络连接数太多时，过多的线程会导致上下文切换开销变大，同时内存开销也会上涨。每个连接都要打开一个文件句柄，当然从成本上讲，这个消耗相对内存是小了很多。但换个角度，文件句柄也被其他模块消耗着，比如WT存储引擎，就需要消耗大量的文件句柄。链接数的上限需要综合考虑性能，稳定性，业务需求。多方面去考虑，缺一不可。

#### 1）Mongo Driver
MongoDB 各个语言的Driver 基本都会封装包含一个 MongoClient 的对象，通常应用在使用时构造一个全局 MongoClient，然后在后续的请求中使用该全局对象来发送请求给Mongo。

```csharp
// global MongoClient object
var mongoClient = new MongoClient("mongodb://localhost");

// request1
var mongo1 = mongoClient.getDatabase("db1").getCollection("col1");
mongo1.find({...});

// request2
var mongo2 = mongoClient.getDatabase("db2").getCollection("col2");
mongo2.update({...});
```

通常每个 MongoClient 会包含一个连接池，默认大小为100，也可以在连接字符串中通过 maxPoolSize 选项来指定。

一种典型的错误使用方式是，用户为每个请求都构造一个 MongoClient，请求结束释放 MongoClient（或根本没释放），这样做问题是请求模型从长连接变成了短连接，每次短连接都会增加“建立 tcp 连接 + mongodb鉴权”的开销，并且并发的请求数会受限于连接数限制，极大的影响性能；另外如果 MongoClient 忘记释放，会导致MongoClient 连接池里连接一直保持着，最终耗光所有的可用连接。

```csharp
//错误示范

// request1
var mongoClient1 = new MongoClient("mongodb://localhost");
var mongo1 = mongoClient1.getDatabase("db1").getCollection("col1");
mongo1.find({...});

// request2
var mongoClient2 = new MongoClient("mongodb://localhost");
var mongo2 = mongoClient1.getDatabase("db2").getCollection("col2");
mongo2.update({...});
```

#### 2）连接池配置

通常 MongoClient 使用默认100的连接池都没问题，当访问同一个 Mongo 的源比较多时，则需要合理的规划连接池大小。

举个例子，Mongo 的连接数限制为2000，应用业务上有40个服务进程可能同时访问 这个Mongod，这时每个进程里的 MongoClient 的连接数则应该限制在 2000 / 40 = 50 以下 （连接复制集时，MongoClient 还要跟复制集的每个成员建立一条连接，用于监控复制集后端角色的变化情况）。

### 8.3 初始化

```csharp
//连接到mongo服务器
var client = new MongoClient("mongodb://localhost");
//获取指定数据库，如果不存在则创建
var database = client.GetDatabase("test");
//获取集合(类似"表"),如果不存在则创建
var persons = database.GetCollection<Person>("persons");
```

### 8.4 Filter
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

### 8.5 插入数据
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

![mongo数据格式](https://s2.ax1x.com/2020/01/21/1Fuilt.jpg)

```csharp
//json数据插入
var persons = database.GetCollection<BsonDocument>("persons");
persons.InsertOne(BsonDocument.Parse("{Name:'Colin',Age:18}"));
persons.InsertOne(BsonDocument.Parse("{Name:'Colin',Age:18,Gender:0}"));
```

MongoDB 是用 json 保存的,因此也可以直接以 json 格式插入,用 `BsonDocument` 来代表,如果使用`BsonDocument`类型来代表数据类型，那获取Collection时也必须使用相同类型。Json是松散的数据结构，可以有任意不同字段，不像关系表中数据字段必须一致。

### 8.6 删除数据
```csharp
//删除数据库
await client.DropDatabaseAsync("test");

//数据Collection
await client.DropCollectionAsync("persons");

//数据Document
var filter = Builders<Person>.Filter.Where(p => p.Age >= 18);//删除年龄大于18的所有人
await persons.DeleteManyAsync(filter);
```

### 8.7 更新数据
```csharp
var filter = Builders<Person>.Filter.Where(p => p.Age <= 5);
var update = Builders<Person>.Update.Set(p=>p.Age,8);
persons.UpdateMany(filter, update);
```

### 8.8 查询数据
1）Count

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
            Console.WriteLine(p.Name);
    }
}
```
`FindAsync` 不直接返回集合,而是要 `MoveNext` 之后返回一个集合呢。因为查询的数据量可能很大,因此 MongoDB 是分批下载,下载一批之后执行 `GET_More` 操作返回下一批。可以通过 `FindOptions` 参数的 `BatchSize` 设置每一批的大小。

如果确认返回的数据量不大,可以 `var ps = await personsCursor.ToListAsync()` (或 `ToEnumerable()`)一次返回所有数据。

3）Sort
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

### 8.9 MongoHelper
仿照关系型数据库中`SqlHelper`,我们可以将对Mongo的常用操作封装到一个`MongoHelper`中,支持简单CRUD操作，包含分页、排序、大数量查询等常用功能。

代码已上传到 [Github](https://github.com/colin-chang/mongohelper)，这里不再展开。

具体使用方式可以查看[单元测试](https://github.com/colin-chang/MongoHelper/blob/master/ColinChang.MongoHelper.Test/MongoHelperTest.cs)

> [Nuget - ColinChang.MongoHelper](https://www.nuget.org/packages/ColinChang.MongoHelper/)

```sh
# Package Manager
Install-Package ColinChang.MongoHelper

# .NET CLI
dotnet add package ColinChang.MongoHelper
```