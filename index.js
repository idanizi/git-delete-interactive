#!/usr/bin/env node

const {promisify} = require('util')
const exec = promisify(require('child_process').exec)
const prompts = require('prompts')
const {program} = require('commander')

program
    .name('gdi')
    .description('Quick delete git branches')
    .option('-f, --force', 'delete by force, as "git branch -D <branch>" will do')
    .parse()

async function run() {
    try {
        const {stdout: branches} = await exec('git branch -v --sort=-committerdate')

        const choices = branches
            .split(/\n/)
            .filter(branch => !!branch.trim())
            .map(branch => {
                const [, flag, value, hint] = branch.match(/([* ]) +([^ ]+) +(.+)/)
                return {value, hint, disabled: flag === '*'}
            })

        const {selectedBranches} = await prompts({
            type: 'multiselect',
            name: 'selectedBranches',
            message: 'Delete branches (right arrow key to select, `a` to select all)',
            choices,
            hint: choices[0].hint,
            warn: 'current branch',
            instructions: false,
            onRender() {
                this.hint = choices[this.cursor].hint
            }
        })

        await deleteBranches(selectedBranches)
    } catch (err) {
        onError(err)
    }
}

async function deleteBranches(branches) {
    if (!branches) return
    const deleteFlag = program.opts().force ? '-D' : '-d'
    for (let branch of branches) {
        try {
            const {stdout, stderr} = await exec(`git branch ${deleteFlag} ${branch}`)
            process.stdout.write(stdout)
            process.stderr.write(stderr)
        } catch (err) {
            onError(err)
        }
    }
}

function onError(e) {
    if (e.stderr) {
        process.stderr.write(e.stderr)
    } else {
        console.error(e)
    }
}

run().catch(onError)
