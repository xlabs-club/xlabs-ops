# xlabs-ops

关于 DevOps, DataOps, FinOps 以及 AIOps 的平台工程实践。

项目结构介绍：

- **argo-hub**: 一些通用 Argo Workflows 模板。
- **git-extras**: 一些运维常用 Git 脚本，比如如何快速同步两个 Git Repository。
- **xlabs-k8s-starter**: 使用 Pulumi 作为 IaC 工具，一键部署一套 Kubernetes 环境，并安装 Keycloak、Argo、Backstage 等平台工程软件。

## xlabs-k8s-starter

使用 [Pulumi][] 创建 K8S 集群，部署和更新 Keycloak、Argo、Backstage 等应用。

Pulumi 本地开发快速入门。

```bash

# 使用前需要先 cd 到 Pulumi 项目的根目录，一切 pulumi 命令需在根目录下执行
cd xlabs-k8s-starter

# 查看当前项目信息
pulumi about

# 登录，测试时使用本地存储，更多登录方式参考官方说明
pulumi login --local

# 为了命令行操作方便，建议增加环境变量，避免检查更新、避免每次都要输入密码
export PULUMI_SKIP_UPDATE_CHECK=1
export PULUMI_CONFIG_PASSPHRASE=your-local-secret-key
export PULUMI_ACCESS_TOKEN=your-pulumi-cloud-access-key

# 查看当前登录情况下 stack 列表，选择 `dev` stack
pulumi stack ls
pulumi stack select dev

# 设置明文变量，可以 pulumi 代码中引用
pulumi config set hostnameSuffix cool.nxest.local
# pulumi config set kubernetes:context cool
# 设置加密变量，命令行设置的时候是明文，存入文件的是密文，密文可直接提交到 git
pulumi config set --secret xlabs-k8s-starter:argocdServerAdminPassword your-password

# 执行资源更新， 加上 -y 不提示直接执行
pulumi up -y

# 导出 Stack 生成的资源
# pulumi 文件里 export 变量
export const caCertificatePem = caCert.certPem;
# 在 index.ts 中用 `export * from`
export * from "./cert-manager";
# 命令行导出成文件
pulumi stack output caCertificatePem --show-secrets > output/ca.crt.pem

```

[Pulumi]: https://github.com/pulumi/pulumi
