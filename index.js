#!/usr/bin/env node

const {promisify} = require('util')
const exec = promisify(require('child_process').exec)
const prompts = require('prompts')

async function run() {
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
        message: 'Delete branches',
        choices,
        hint: choices[0].hint,
        warn: 'current branch',
        // onState({value}) {
        //     console.log({'this.hint': this.hint, choices})
        //     // this.hint = choices.find(c => c.value === value).hint
        // }
    })

    await deleteBranches(selectedBranches)
}

async function deleteBranches(branches) {
    console.log({branches})
    // if (!branches) return
    // for (let branch of branches) {
    //     const {stdout, stderr} = await exec(`git branch -d ${branch}`)
    //     process.stdout.write(stdout)
    //     process.stderr.write(stderr)
    // }
}

function onError(e) {
    if (e.stderr) {
        process.stderr.write(e.stderr)
    } else {
        console.error(e)
    }
}

run().catch(onError)
