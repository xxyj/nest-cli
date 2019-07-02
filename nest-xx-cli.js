#!/usr/bin/env node

const download = require('download-git-repo')
const commander = require('commander')
const fsExtra = require('fs-extra')
const fs = require('fs')
const chalk = require('chalk')
const inquirer = require('inquirer')
const exec = require('child_process').exec
const ora = require('ora')

/**
 * Help.
 */

commander.on('--help', function() {
  console.log('  Examples:')
  console.log()
  console.log(chalk.gray('    # init a new project'))
  console.log('    $ nest-xx-cli my-project(项目目录)')
  console.log()
})

/**
 * Help.
 */

function help() {
  commander.parse(process.argv)
  if (commander.args.length !== 1) return commander.help()
}

/**
 * 问答配置
 */
function answers(flag) {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'projectName',
        validate(input) {
          const done = this.async()
          setTimeout(function() {
            if (input === '') {
              done('请先输入项目名称')
              return
            }
            done(null, true)
          }, 100)
        },
        message: '请输入项目名称:'
      },
      {
        type: 'rawlist',
        name: 'databaseType',
        default: 'mysql',
        choices: ['mysql'],
        message: '请选择数据库:',
        validate(input) {
          const done = this.async()
          setTimeout(function() {
            if (['mysql'].indexOf(input) === -1) {
              done('请选择一种模板')
              return
            }
            done(null, true)
          }, 100)
        }
      }
    ])
    .then(ans => {
      if (flag) {
        fsExtra.removeSync(folder)
        console.log(chalk.green('删除目录\'' + folder + '\' 成功\n'))
      }
      getTemplate(ans)
    })
}

/**
 * 模板下载更新
 */
function getTemplate(ans) {
  fs.mkdirSync(folder)
  console.log(chalk.green('新建目录\'' + folder + '\' 成功\n'))
  console.log(chalk.blue('开始下载模板'))
  const spinner = ora(chalk.green('模板下载中,请稍后...')).start()
  download(
    'direct:https://github.com/xxyj/nest-template.git#master',
    folder,
    { clone: true },
    err => {
      spinner.stop()
      if (err) {
        console.log(chalk.red('下载模板失败 : ' + err.message.trim()))
        return
      }
      console.log(chalk.green('模板下载成功'))
      console.log(chalk.blue('更新模板数据'))
      // 删除git的关联
      exec(`rm -rf ${folder}/.git`)
      const pkg = folder + '/package.json'
      if (!fs.existsSync(pkg)) {
        console.red(chalk.blue('缺少package.json，更新失败'))
        return
      }
      fs.readFile(pkg, { flag: 'r+', encoding: 'utf8' }, (err, data) => {
        if (err) {
          console.log(chalk.red(err))
          return
        }
        let params = JSON.parse(data)
        params.description = ans.projectName
        params = JSON.stringify(data, null, '\t')
        fs.writeFile(pkg, data, err => {
          if (err) {
            console.log(chalk.red(err))
            return
          }
          console.log(chalk.green('模板更新成功'))
        })
      })
    }
  )
}
help()
const folder = commander.args[0]
/**
 * 开始配置模板
 */

if (fs.existsSync(folder)) {
  inquirer
    .prompt([
      {
        type: 'confirm',
        name: 'cover',
        message: '目录已存在，是否覆盖？:'
      }
    ])
    .then(ans => {
      if (ans.cover) {
        answers(true)
      }
    })
} else {
  answers()
}
