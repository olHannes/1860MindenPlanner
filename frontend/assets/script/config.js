export let serverURL = "https://one860mindenplanner.onrender.com";
serverURL = "/api";

export const APPARATUS = [
    {
        id: "FL",
        nameDe: "Boden",
        nameEn: "Floor",
        icon: "./assets/images/equipment/Floor_icon.png",
        facts: [
            "Anzahl der Elemente: 6 + Abgang",
            "Maße der Bodenfläche: 12 x 12m",
            "Dauer der Übung: max. 75 sek."
        ],
        groups: [
            "Nicht-akrobatische Elemente",
            "Akrobatische Elemente vorwärts",
            "Akrobatische Elemente rückwärts"
        ]
    },
    {
        id: "PO",
        nameDe: "Pauschenpferd", 
        nameEn: "Pommel-Horse",
        icon: "./assets/images/equipment/Pommelhorse_icon.png",
        facts: [
            "Anzahl der Elemente: 6 + Abgang",
            "Übungsbeginn: mit geschlossenen Beinen aus dem Stand"
        ],
        groups: [
            "Einbeinschwünge und Scheren",
            "Kreis- und Thomasflanken, Kehrschwünge, Russenwendeschwünge",
            "Wanderelemente",
            "Abgänge"
        ]
    },
    {
        id: "RI",
        nameDe: "Rings", 
        nameEn: "Rings",
        icon: "./assets/images/equipment/Rings_icon.png",
        facts: [
            "Anzahl der Elemente: 6 + Abgang",
            "Übungsbeginn: im ruhigen Hang mit gestreckten Armen und Beinen"
        ],
        groups: [
            "Kippen und Schwungelemente, Schwünge durch den Handstand",
            "Kraft- und Halteelemente",
            "Schwung zu Kraftelementen",
            "Abgänge"
        ]
    },
    {
        id: "VA",
        nameDe: "Sprung", 
        nameEn: "Vault",
        icon: "./assets/images/equipment/Vault_icon.png",
        facts: [
            "Anzahl der Sprünge: 2 (unterschiedliche Gruppen möglich)"
        ],
        groups: [
            "Salti mit oder ohne Drehung",
            "Überschlagsprünge ohne oder mit Drehungen",
            "Überschlagsprünge seitwärts und Tsukahara-Sprünge",
            "Rondatsprünge"
        ]
    },
    {
        id: "PA",
        nameDe: "Barren", 
        nameEn: "Parralel-Bars",
        icon: "./assets/images/equipment/Parralelbars_icon.png",
        facts: [
            "Anzahl der Elemente: 6 + Abgang",
            "Höhe: 180cm (ab Mattenoberkante), 200cm (ab Boden)"
        ],
        groups: [
            "Elemente im Stütz oder durch den Stütz auf beiden Holmen",
            "Elemente, die im Oberarmstütz beginnen",
            "Schwungelemente durch den Hang an 1 oder 2 Holmen",
            "Abgänge"
        ]
    },
    {
        id: "HI",
        nameDe: "Reck", 
        nameEn: "Highbar",
        icon: "./assets/images/equipment/Highbar_icon.png",
        facts: [
            "Anzahl der Elemente: 6 + Abgang",
            "Höhe: 260cm (ab Mattenoberkante), 280cm (ab Boden)"
        ],
        groups: [
            "Langhangschwünge mit und ohne Drehungen",
            "Flugelemente",
            "Stangennahe und Adler-Elemente",
            "Abgänge"
        ]
    }
];


export const FilterElements = {
    difficulty: [
        { label: "Alle", value: "" },
        { label: "NE", value: "0.05" },
        { label: "A", value: "0.1" },
        { label: "B", value: "0.2" },
        { label: "C", value: "0.3" },
        { label: "D", value: "0.4" },
        { label: "E", value: "0.5" }
    ],
    groups: [
        { label: "Alle", value: "" },
        { label: "1", value: "1" },
        { label: "2", value: "2" },
        { label: "3", value: "3" },
        { label: "4", value: "4" }
    ]
};


export const ProfileColors = [
    { color: "#FF5733" },
    { color: "#28A745" },
    { color: "#007BFF" },
    { color: "#FFC107" },
    { color: "#6F42C1" },
];


export const StartMessage = `
Auf dieser Seite kannst du Übungen zusammenstellen und Wettkämpfe einsehen.
Unten im Menü findest du folgende Elemente: <Übungsgestaltung, Nutzerübersicht, Wettkämpfe, Profileinstellungen>.
Im Downloads-Bereich findest du außerdem die aktuellen PDF Dokumente zum <i>Code-of-Points</i> und zu den Bildertabellen.
`;

export const DownloadSubfolder = "./pdfFiles"
export const DownloadElements = [
    { label: "Boden - Bildtabelle (NE)",            value: "/LK_M_NE_Bildtabellen_Boden.pdf",            group: "2022 - 2024" },
    { label: "Pauschenpferd - Bildtabelle (NE)",    value: "/LK_M_NE_Bildtabellen_Seitpferd.pdf",        group: "2022 - 2024" },
    { label: "Ringe - Bildtabelle (NE)",            value: "/LK_M_NE_Bildtabellen_Ringe.pdf",            group: "2022 - 2024" },
    { label: "Sprung - Bildtabelle (NE)",           value: "/LK_M_NE_Bildtabellen_Sprung.pdf",           group: "2022 - 2024" },
    { label: "Barren - Bildtabelle (NE)",           value: "/LK_M_NE_Bildtabellen_Barren.pdf",           group: "2022 - 2024" },
    { label: "Reck - Bildtabelle (NE)",             value: "/LK_M_NE_Bildtabellen_Reck.pdf",             group: "2022 - 2024" },
    { label: "Code of Points 2022 - 2024",          value: "/Code_of_Points__GT-Maenner_2022-2024.pdf",  group: "2022 - 2024" },
    { label: "Code of Points 2025 - 2028",          value: "/en_1.1 - MAG Code of Points 2025-2028.pdf", group: "2025 - 2028" },
]


export const NewsElements = [
    { label: "Refactoring", value: "Neue Styles, verbesserte Funktionalität und Bugfixes" },
    { label: "Account Verifizierung", value: "Account Erstellung ab jetzt mit E-Mail + Acountfreischaltung /-Passwortänderung nur noch mit E-Mail"},
]