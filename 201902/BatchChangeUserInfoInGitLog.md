# 批量修改Git提交记录中的用户和密码

## 背景

因为经常在家办公，修改密码的时候不小心把Git中的用户名和邮箱都改成了公司的用户名和邮箱（如下）。导致在提交Github时，使用了公司的信息，造成不良影响。

```javascript

// 1. 当公司密码修改后，Git提示Auth失败，这时候经常用下面的方式重置Git缓存的密码

git config --global user.name ''

// 2. 然后重新输入用户名和密码

```

## 解决办法

解决的方法分为3步：

1. 修改项目根目录下Git的用户名和邮箱
2. 编写执行脚本批量替换Git的用户名和邮箱
3. 强制Push

### 1. 修改当前目录下Git的用户名和邮箱

```bash
git config user.name 'SmileSmith'
git config user.email 'longde_chen@163.com'
```

### 2. 修改当前目录下Git的用户名和邮箱

编写如下shell脚本，放到项目根目录下：

+ OLD_EMAIL:错误的邮箱
+ CORRECT_NAME:正确的作者名
+ CORRECT_EMAIL:正确的邮箱

```bash

#!/bin/sh

git filter-branch --env-filter '

OLD_EMAIL="error@error.com"
CORRECT_NAME="SmileSmith"
CORRECT_EMAIL="longde_chen@163.com"

if [ "$GIT_COMMITTER_EMAIL" = "$OLD_EMAIL" ]
then
export GIT_COMMITTER_NAME="$CORRECT_NAME"
export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
fi
if [ "$GIT_AUTHOR_EMAIL" = "$OLD_EMAIL" ]
then
export GIT_AUTHOR_NAME="$CORRECT_NAME"
export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags

```

命名为fix.sh放到根目录，执行shell脚本。

+ 如果提示`permission deny`等没权限，在shell下添加文件权限：

```bash
chmod 777 fix.sh
```

+ 如果提示shell脚本执行失败，执行如下：

```bash
git filter-branch -f --index-filter 'git rm --cached --ignore-unmatch Rakefile' HEAD
```

### 3. 将修改强制Push到远程

```bash
git push origin --force --all
```

## 验证

在项目根目录下执行

```bash
git log
```
