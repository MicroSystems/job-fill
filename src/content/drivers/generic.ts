import type { FillResponse } from "../../types";
import type { FillDriver } from "../driver";
import { fillAllFields } from "../filler";

export const genericDriver: FillDriver = {
  async fill(profile: Record<string, any>, _profileRaw: any): Promise<FillResponse> {
    // The generic driver is a pure label-matching driver — fillAllFields does exactly this.
    return fillAllFields(profile);
  },
};
