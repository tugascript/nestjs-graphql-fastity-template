/*
 This file is part of Nest GraphQL Fastify Template

 This project is dual-licensed under the Mozilla Public License 2.0 (MPLv2) and the
 GNU General Public License version 3 (GPLv3).

 You may use, distribute, and modify this file under the terms of either the MPLv2
 or GPLv3, at your option. If a copy of these licenses was not distributed with this
 file. You may obtain a copy of the licenses at https://www.mozilla.org/en-US/MPL/2.0/
 and https://www.gnu.org/licenses/gpl-3.0.en.html respectively.

 Copyright © 2023
 Afonso Barracha
*/

import { Logger } from '@nestjs/common';
import cluster from 'cluster';
import os from 'os';
import { isUndefined } from './config/utils/validation.util';

export class Cluster {
  private static readonly loggerService = new Logger(Cluster.name);

  public static createCluster(main: () => Promise<void>): void {
    const cpuCount = Cluster.getCpuCount();

    if (cluster.isMaster) {
      Cluster.loggerService.log(`Starting cluster with ${cpuCount} workers...`);
      Cluster.loggerService.log(
        `Master server is running on process ${process.pid}`,
      );

      for (let i = 0; i < cpuCount; i++) {
        Cluster.loggerService.log(`Forking process number ${i + 1}...`);
        cluster.fork();
      }

      cluster.on('exit', (worker) => {
        Cluster.loggerService.warn(`Worker ${worker.id} died. `);
        Cluster.loggerService.warn('Starting a new worker...');
        cluster.fork();
      });
    } else {
      main();
    }
  }

  private static getCpuCount(): number {
    if (!isUndefined(process.env.WORKERS_COUNT)) {
      return parseInt(process.env.WORKERS_COUNT, 10);
    }
    if (
      !isUndefined(process.env.NODE_ENV) &&
      process.env.NODE_ENV === 'production'
    ) {
      return os.cpus().length;
    }
    return 2;
  }
}
