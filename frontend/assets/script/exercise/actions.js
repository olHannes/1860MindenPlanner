import * as api from "./api.js";
import { state } from "./state.js";


export async function setupCurrentExercise(root) {
    const userId = localStorage.getItem("userId");
    const routineType = state.routine.mode == "wish" ? "1" : "0";

    if(!userId || !root) return;

    const res = await api.fetchExercise({
        userId: userId,
        apparatusId: state.navigation.selectedApparatusId,
        routineType: routineType
        });
    
    const exercise                  = res?.exercise ?? null;
    state.routine.elements          = exercise?.elemente ?? [];
    state.routine.originalElements  = exercise?.elemente ?? [];
    state.routine.community.avg     = exercise?.communityAvg ?? 0;
    state.routine.community.count   = exercise?.communityCount ?? 0;

    const autoRate = res?.autoRating; 
    if(autoRate) state.routine.autoRating = autoRate;

    root.querySelector("#comp-routine-btn")?.classList.toggle("is-active", routineType == "0");
    root.querySelector("#wish-routine-btn")?.classList.toggle("is-active", routineType == "1");
}






