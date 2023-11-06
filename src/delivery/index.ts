import {Command} from 'commander'
import {calculateDeliveryTimeRemaining, printResults} from '../lib/delivery'
import {readConfig} from '../lib/fs'
import {DeliveryProjectionConfig} from '../types'

export const deliveryCommand = new Command()
  .name('delivery')
  .alias('d')
  .argument('<config-file>', 'File that stores the delivery projection config')
  .action(async configFile => {
    const config: DeliveryProjectionConfig = await readConfig(configFile)
    const result = await calculateDeliveryTimeRemaining(config)
    printResults(result, config)
  })
