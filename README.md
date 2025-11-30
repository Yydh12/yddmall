# 有点多商城

一个基于 Spring Boot 3 + Vue 3 的前后端分离电商平台，涵盖用户登录、商品与店铺、购物车与订单、支付流程、优惠券与红包、收藏与足迹、商家后台、系统管理等完整功能。

## 功能特性
- 用户与鉴权：支持用户名/手机号登录，后端签发 JWT，前端自动携带 Token；控制器层统一校验会话
- 商品与店铺：类目树与筛选，店铺详情，商品列表与详情，商家发布与管理商品
- 购物车与订单：购物车增删改查，购物车下单/直接购买，支付/取消/发货/确认收货/退款申请与处理/删除，订单统计
- 优惠体系：优惠券/红包领取与管理，金币签到与抵扣，订单级优惠应用与优惠明细查询
- 用户资产：收藏店铺，浏览足迹，个人资料与头像上传
- 系统管理：用户管理、店铺管理，接口文档分组与演示
- 体验优化：路由滚动位置保存与恢复，统一错误提示与数据剥离，提升导航与调试体验

## 技术栈
- 前端：Vue 3、Vite、Vue Router、Element Plus、Axios
- 后端：Spring Boot 3、MyBatis-Plus、Spring Security、JJWT、Knife4j / springdoc-openapi
- 数据与工程：MySQL、Lombok、Maven、代码生成器、文件上传

## 目录结构
- `my_mall/` 前端项目（Vue 3 + Vite）
- `yddmall/` 后端项目（Spring Boot 3）

## 快速开始
### 环境要求
- Node.js 18+，npm
- JDK 17+，Maven（或使用仓库内 `mvnw`）
- MySQL 8+

### 初始化数据库
- 创建数据库 `yddmall`
- 导入SQL：
  - `order_tables.sql`、`discount_tables.sql`、`cart_table.sql`、`favorite_merchant_table.sql`、`browse_history_table.sql` 等
- 配置数据库连接：编辑后端 `yddmall/src/main/resources/application.properties`
  - `spring.datasource.url=jdbc:mysql://localhost:3306/yddmall?...`
  - `spring.datasource.username=<你的用户名>`
  - `spring.datasource.password=<你的密码>`

### 配置上传与文档
- 编辑后端 `yddmall/src/main/resources/application.yml`：
  - `upload.base-path`：磁盘存储目录（例如 `E:/uploads/images`）
  - `upload.access-url`：对外访问前缀（默认 `/images`）
  - `springdoc.swagger-ui.path=/swagger-ui`（接口文档入口）
- 静态资源映射：访问 `http://localhost:8080/images/{userId}/{fileName}` 即可读取上传文件
- CORS：默认允许 `http://localhost:5173`/`5174` 前端开发端口访问，可在后端 `CorsConfig` 中调整

### 启动后端
```bash
# Windows 推荐使用仓库内 Maven Wrapper
cd yddmall
./mvnw.cmd spring-boot:run
# 或使用系统 Maven
mvn spring-boot:run
# 后端默认启动在 http://localhost:8080
```

### 启动前端
```bash
cd my_mall
npm install
npm run dev
# 前端默认启动在 http://localhost:5173
```

### 接口文档
- 访问 `http://localhost:8080/swagger-ui` 查看分组文档（用户、商品类目、店铺、属性、SKU、订单、优惠等）

## 关键模块
- 鉴权与会话：后端登录签发 JWT；前端请求拦截器自动附带 `Authorization: Bearer <token>`；后端控制器统一从请求头解析用户会话
- 订单闭环：创建订单（购物车/直购）、支付、取消、发货、确认收货、退款（申请/同意/拒绝）、删除、统计
- 优惠体系：优惠券/红包领取与启停、金币钱包签到与抵扣、订单级应用与优惠明细查询；支持“未拥有红包时尝试领取”的兼容策略
- 上传与资源：按用户编号/ID 分目录存储，访问路径按 `upload.access-url` 拼装，统一静态资源对外暴露
- 统一协议：抽象统一响应体与全局异常处理，提升接口一致性与可维护性

## 前后端联调说明
- 前端默认与后端通过 `http://localhost:8080` 通讯（Axios 基址）
- 请求拦截器自动附带 `Authorization`（从 `localStorage/sessionStorage` 读取 `token`），并在缺失 Token 时附带 `X-User-Id` 兜底（开发联调用）
- 如需变更后端端口或跨域来源，请同步调整后端 CORS 配置与前端请求基址

## 安全与配置提示
- JWT 密钥：请将后端 JWT 签名密钥改为安全值，推荐从配置文件或环境变量读取；避免将真实密钥硬编码到代码仓库
- 地理服务 Key：`application.yml` 中包含示例 Key，仅用于本地开发，请替换为你自己的服务端/浏览器端 Key，并妥善保管
- 上传目录：确保 `upload.base-path` 指向安全且可写的磁盘目录，并按需设置读写权限

## 常见问题
- 接口 401/鉴权失败：检查前端是否存储并附带了 `token`，或在开发阶段是否附带了 `X-User-Id`
- 上传失败/无法访问：确认上传目录存在且可写，访问路径是否以 `/images/` 开头，文件名与目录是否正确
- 跨域错误：确认前端访问域名与端口是否在后端 CORS 白名单中

## License
- 本项目仅用于学习与毕业设计演示，商用请谨慎评估并完善安全与合规配置
