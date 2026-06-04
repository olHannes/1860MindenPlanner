export const state = {
    navigation: {
        currentView: "apparatus-list",
        selectedApparatusId: null,
        selectedApparatusIndex: -1
    },
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
            order: "group_up"
        },
        items: [],
    },
    elementDetails: {
        isOpen: false,
        elements: [],
        currentIndex: 0,
        startX: 0,
        currentTranslatePx: 0,
        baseTranslatePx: 0,
        isDragging: false,
    },
};