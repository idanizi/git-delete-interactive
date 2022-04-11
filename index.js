#!/usr/bin/env node

const {promisify} = require('util')
const exec = promisify(require('child_process').exec)
const prompts = require('prompts')

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
    for (let branch of branches) {
        try {
            const {stdout, stderr} = await exec(`git branch -d ${branch}`)
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
