
import * as config from "../config.js";
import { bindSettingEvents } from "./events.js";
import { bindAccountDeletionEvents } from "./views/view-account-deletion-settings.js";
import { renderColorPicker } from "./views/view-color-settings.js";
import { bindNameSettingsEvents } from "./views/view-profile-settings.js";
import { bindReportEvents } from "./views/view-report-settings.js";


export function initSettingsFeature(root) {
    if(!root) return;
    
    renderColorPicker(root, config.ProfileColors);
    
    bindSettingEvents(root);
    bindNameSettingsEvents(root);
    bindReportEvents(root);
    bindAccountDeletionEvents(root);
}
