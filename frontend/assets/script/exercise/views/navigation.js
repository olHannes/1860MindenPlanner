
import { VIEWS } from "../constants.js";
import { state } from "../state.js";

export function showView(root, next) {
    state.view = next;
    
    const viewApparatusList = root.querySelector("#view-apparatus-list");
    const viewApparatusDesc = root.querySelector("#view-apparatus-detail");
    const viewEditor        = root.querySelector("#view-apparatus-editor");
    const viewElementList   = root.querySelector("#view-element-list");
    //const viewElementDetail = root.querySelector("#view-element");
    const viewElementDetail = root.querySelector("#view-details-overlay");


    if(viewApparatusList) viewApparatusList.hidden  = next !== "apparatus-list";
    if(viewApparatusDesc) viewApparatusDesc.hidden  = next !== "apparatus-desc";
    if(viewEditor) viewEditor.hidden                = next !== "routine-editor";
    if(viewElementList) viewElementList.hidden      = next !== "element-list"
    if(viewElementDetail) viewElementDetail.hidden  = next !== "element-details";
}