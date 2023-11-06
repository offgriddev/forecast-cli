import {Command} from 'commander'
import {printCommits} from './print'
import {getDeveloperStatisticsBySha} from './sha-get'

export const commitsCommand = new Command()
  .name('commits')
  .alias('c')
  .addCommand(printCommits)
  .addCommand(getDeveloperStatisticsBySha)
