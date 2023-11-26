# kaniko

使用 kaniko 构建容器镜像。

## 准备工作

1. Git 拉取，配置 ssh private key 以便允许拉取 git 代码。创建 secret 供 WorkflowTemplate 使用，注意创建的 secret 与 WorkflowTemplate 引用保持一致。以下命令仅供参考。

    ```bash
    # 注意需要的是 private key 文件，不是 pub 文件
    kubectl --namespace argo-workflows create secret generic github-creds --from-file=ssh-private-key=~/.ssh/id_ed25519
    ```

2. 镜像仓库认证。创建 docker config 挂载给 kaniko pod 使用。

    ```bash
    echo "{\"auths\":{\"docker.io\":{\"username\":\"username\",\"password\":\"password\"}}}" > config.json
    
    kubectl --namespace argo-workflows create secret generic docker-config --from-file=config.json
    ```

## 注意事项

1. 默认配置的 Git 拉取方式是 ssh，填写 repo 地址的时候也需要是 ssh 地址，否则会出现 'invalid auth method' 错误。
2. 默认编译 `--platforms linux/amd64`，根据需要自行修改。
3. kaniko 当前还不支持一次性编译多个架构，如果是多架构需要多次编译，然后使用 manifest-tool 合并。

## TODO

EXTRA_ARGS
多 Tag
参考 https://flavio.castelli.me/2020/10/05/build-multi-architecture-container-images-using-argo-workflow/ 实现多架构编译。