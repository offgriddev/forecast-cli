#!/usr/bin/env node

import {Command} from 'commander'
import {deliveryCommand} from './delivery'
import {commitsCommand} from './commits'

const program = new Command()
  .name('forecaster')
  .description(
    'A set of CLI tools to process project complexity data to estimate a delivery day.'
  )
  .addCommand(commitsCommand)
  .addCommand(deliveryCommand)

program.parse()
