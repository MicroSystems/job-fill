import type { FillResponse } from "../types";
import { genericDriver } from "./drivers/generic";
import { greenhouseDriver } from "./drivers/greenhouse";
import { leverDriver } from "./drivers/lever";
import { ashbyDriver } from "./drivers/ashby";
import { workdayDriver } from "./drivers/workday";
import { smartrecruitersDriver } from "./drivers/smartrecruiters";
import { workableDriver } from "./drivers/workable";
import { ripplingDriver } from "./drivers/rippling";

export interface FillDriver {
  fill(profile: Record<string, any>, profileRaw: any): Promise<FillResponse>;
  submitSelector?: string;
  nextSelector?: string;
  reviewSelector?: string;
  successSelector?: string;
}

const drivers: Record<string, FillDriver> = {
  generic: genericDriver,
  greenhouse: greenhouseDriver,
  lever: leverDriver,
  ashby: ashbyDriver,
  workday: workdayDriver,
  smartrecruiters: smartrecruitersDriver,
  workable: workableDriver,
  rippling: ripplingDriver,
};

export async function fill(
  platform: string,
  profile: Record<string, any>,
  profileRaw: any,
): Promise<FillResponse> {
  const driver = drivers[platform] ?? drivers.generic;
  return driver.fill(profile, profileRaw);
}

export function getDriver(platform: string): FillDriver {
  return drivers[platform] ?? drivers.generic;
}
