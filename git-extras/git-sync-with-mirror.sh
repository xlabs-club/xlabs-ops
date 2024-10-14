#!/usr/bin/env bash

# git pull a repo, and then push to another repo

# 一个简单的代码同步脚本
# 从一个git仓库，完全同步到另一个全新的镜像仓库，包括所有的分支和Tag

# 如果你需要设置（或取消）代理，请参考以下命令
# git config http.proxy http://192.168.1.100:8080
# git config https.proxy http://192.168.1.100:8080
# git config --unset http.proxy
# git config --unset https.proxy

# 如果你需要忽略https证书认证，请增加 `-c http.sslVerify=false`
# git -c http.sslVerify=false clone 

git clone --mirror git@example.com/upstream-repository.git
cd upstream-repository.git
git push --mirror git@example.com/new-location.git

# 或者通过用户名/密码(gitlab可能限制了只允许使用token)方式

# git clone --mirror https://username:password@example.com/upstream-repository.git
# git push --mirror https://username:password@example.com/new-location.git

 

