import { VIEWS } from "./constants.js";

export const state = {
    navigation: {
        currentView: "apparatus-list",
        selectedApparatusId: null,
        selectedApparatusIndex: -1
    },
    favoriteApparatusId: null,
    routine: {
        mode: "competition",
        elements: [],
        originalElements: [],
        autoRating: {},
        community: { avg: 0, count: 0 },
        saved: true,
    },
    elementList: {
        filter: {
            difficulty: null,
            group: null,
            learned: false,
            search: "",
            order: "value_up"
        },
        items: [],
    },
    elementDetails: {
        isOpen: false,
        elements: [],
        returnView: VIEWS.ELEMENT_LIST,
        source: "element-list",
        currentIndex: 0,
        startX: 0,
        currentTranslatePx: 0,
        baseTranslatePx: 0,
        isDragging: false,
    },
};