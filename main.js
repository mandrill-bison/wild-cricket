var previous_states_json = [];

var model = {
    nb_joueurs: 1,
    tour: 1,
    joueur: 1,
    fleche: 1,
    tableau_header: [25,20,19,18,17,16,15],
    tableau_score: [],
    scores: [],
    player_names: [],
    total_touches: []
};

function get_moyennes(){
    //Résultats faussé selon qui termine la partie (pas le meme nombre de tours joués)
    let moyennes = []
    for (const touches of model.total_touches){
        moyennes.push(
            (touches / model.tour).toFixed(1)
        )
    }
    return moyennes;
}

function test_game_over(){
    let scores = []
    for (const player of model.tableau_score) {
        scores.push(model.scores[player]);
    }
    for (const joueur of model.tableau_score) {
        let touches = joueur.slice(2);
        if ((touches.every( x => x == 3)) && (joueur[1] == Math.min(...scores))) {
            game_over(joueur[0]);
        }
    }
}

function joueur_suivant(){
    model.joueur += 1;
    randomize_header();
    if (model.joueur > model.nb_joueurs) {
        model.joueur = 1;
        tour_suivant();
    }
    //Compteur fleches
    reset_dart_counter();
}

//Compteur fleches
function reset_dart_counter(){
    document.querySelectorAll('#fleche > img').forEach(img => {
        img.classList.add('dart_available')
    });
}

function refresh_dart_counter(){
    reset_dart_counter();
    let remaining_darts = 4 - model.fleche;
    let dart_counters = document.getElementsByClassName('dart_counter');
    for (let i = 0; i < 3; i++) {
        if (i >= remaining_darts){
            dart_counters[i].classList.toggle('dart_available');
        }
    }
}

function tour_suivant(){
    model.tour += 1;
    if (model.tour > 10){
        game_over("turns");
    };
}

function store_state(state){
    previous_states_json.unshift(JSON.stringify(state));
}

function fleche_suivante(){
    model.fleche += 1;
    model.total_touches[model.joueur - 1].total_darts += 1;
    test_game_over();
    if (model.fleche > 3){
        model.fleche = 1;
        joueur_suivant();
    };
    refreshApp(model);
}

function handler_miss(){
    store_state(model);
    fleche_suivante();
    refreshApp(model);
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

function init_randomize_header(){
    for (let i = 0; i < model.tableau_header.length - 1; i++) {
        let new_number = getRndInteger(7, 20);
        while (model.tableau_header.some((cell) => cell == new_number)){
            new_number = getRndInteger(7, 20);
        }
        model.tableau_header[i + 1] = new_number; 
    }
}

function randomize_header(){
    let colones = [];
    for (let index = 0; index < model.tableau_score[0].length; index++) {
        let colone = [];
        for (const joueur of model.tableau_score) {
            colone.push(joueur[index]);
        }
        colones.push(colone);
    }
    for (let i = 0; i < colones.length; i++) {
        if (!(colones[i].every( x => x == 0)) && !(colones[i].includes(3))) {
            let new_number = getRndInteger(7, 20);
            while (model.tableau_header.some((cell) => cell == new_number)){
                new_number = getRndInteger(7, 20);
            }
            model.tableau_header[i] = new_number;
        }
    }
}

function handler_keyboard(column, multi){
    store_state(model);
    let i_joueur = model.joueur - 1;
    for (let index = 0; index < multi ; index++) {
        let does_hit = false;
        if (model.tableau_score[i_joueur][column] < 3){
            model.tableau_score[i_joueur][column] += 1;
            does_hit = true;
        } 
        else {
           for (let joueur = 0; joueur < model.nb_joueurs; joueur ++) {
                if (model.tableau_score[joueur][column] != 3) {
                    model.scores[joueur] += model.tableau_header[column]
                }
           }
        }
        if (does_hit) {
            model.total_touches[model.joueur - 1] += 1;
        }
    }
    fleche_suivante();
}

function handler_undo(){
    if (previous_states_json.length > 0) {
        let previous_state = JSON.parse(previous_states_json[0]);
        model = {...previous_state};
        previous_states_json.shift();
        refreshApp(model);
    }
}

function start_game(nb_joueurs){
    document.getElementById('ecran_accueil').style.display = "none";
    document.getElementById('ecran_app').style.display = "flex";
    for (let i = 0; i < nb_joueurs; i++) {
        //Model
        let n_joueur = "J" + (i + 1).toString();
        model.player_names.push(n_joueur);
        model.scores.push(0);
        model.tableau_score.push([0,0,0,0,0,0,0]);
        model.total_touches.push(0);
        //Vue horizontale
        new_line = document.createElement('tr');
        for (let c = 0; c < model.tableau_score[0].length + 2; c++) {
            let cell = document.createElement('td');
            for (let d = 0; d < 3; d++){
                let dot = document.createElement('span');
                dot.classList.add('dot');
                cell.appendChild(dot);
            }
            new_line.appendChild(cell);
        }
        document.getElementById('tableau_scores_body').appendChild(new_line);
    }
    //Vue verticale
    document.querySelectorAll('#tableau_scores_vertical_body > tr').forEach(line => {
        for (let j = 0; j < nb_joueurs; j++) {
            cell = document.createElement('td');
            for (let d = 0; d < 3; d++){
                let dot = document.createElement('span');
                dot.classList.add('dot');
                cell.appendChild(dot);
            }
            line.appendChild(cell);
        }
    });
    model.nb_joueurs = nb_joueurs;
    init_randomize_header();
    refreshApp(model);
}

function change_vue(){
    let vue_horizontale = document.getElementById('tableau_scores');
    let vue_verticale = document.getElementById('tableau_scores_vertical');
    vue_horizontale.classList.toggle('vue_active');
    vue_verticale.classList.toggle('vue_active');
    if (vue_horizontale.classList.contains('vue_active')) {
        vue_horizontale.style.display = "inline-table";
        vue_verticale.style.display = "none";
    } else {
        vue_horizontale.style.display = "none";
        vue_verticale.style.display = "inline-table";
    }
    
}


function refreshApp(model){
    //Affichage du joueur actif horizontal
    let lines = document.querySelectorAll('#tableau_scores_body > tr');
    lines.forEach(line => {
        line.classList.remove('active_player');
    });
    lines[model.joueur - 1].classList.toggle('active_player');

    //Affichage joueur actif vertical
    document.getElementById("header_tableau_vertical").childNodes.forEach((cell, i) => {
        if (cell.nodeName == "TD") {
            cell.classList.remove('active_player_vertical');
        }        
    });
    document.querySelectorAll('#header_tableau_vertical > td').item(model.joueur - 1).classList.toggle('active_player_vertical');    

    //Affichage du tour en cours
    document.getElementById('tour').innerText = "Tour : " + model.tour;
    
    //Affichage des flèches restantes
    refresh_dart_counter();
    
    //Actualisation du corps du tableau horizontal
    let table_content = document.querySelectorAll('#tableau_scores_body > tr');
    table_content.forEach((row , i) => {
        row.childNodes.forEach((cell , j) => {
            if (j == 0) {
                cell.innerText = model.player_names[i];
            } else if (j == 1) {
                cell.innerText = model.scores[i];
            } else {
                cell.childNodes.forEach(dot => {
                    dot.classList.remove('active');
                })
                cell.childNodes.forEach((dot, d) => {
                    if (d < model.tableau_score[i][j - 2]){
                        dot.classList.add('active');
                    }
                })   
            }
        });
    });

    //Actualisation du tableau vertical
    document.querySelectorAll('#tableau_scores_vertical_body > tr').forEach((line, i) => {
        for (let j = 1; j < line.children.length; j++) {
            if (i == 0) {
                line.children[j].innerHTML = model.player_names[j - 1];
            } else if (i == 1) {
                line.children[j].innerHTML = model.scores[j - 1];       
            } else {
                line.children[j].childNodes.forEach(dot => {
                    dot.classList.remove('active');
                });
                line.children[j].childNodes.forEach((dot, d) => {
                    if (d < model.tableau_score[j - 1][i - 2]){
                        dot.classList.add('active');
                    }
                })   
            }
        }
    });

    //Actualisation du header vertical
    document.querySelectorAll('#tableau_scores_vertical_body th.header_colone_random').forEach((cell, i) => {
        cell.innerHTML = model.tableau_header[i + 1];
    });

    //Actualisation du header horizontal
    let random_header = document.querySelectorAll('#tableau_scores th.header_colone_random');
    random_header.forEach((cell, i ) => {
        cell.innerText = model.tableau_header[i + 1]; // +1 pour éviter le 25 du bull eye 
    });

    //Actualisation des boutons
    document.querySelectorAll('#keyboard-triple .column-button').forEach((button, i) => {
        button.innerHTML = model.tableau_header[i + 1];
    });
    document.querySelectorAll('#keyboard-double .column-button').forEach((button, i) => {
        button.innerHTML = model.tableau_header[i + 1];
    });
    document.querySelectorAll('#keyboard-simple .column-button').forEach((button, i) => {
        button.innerHTML = model.tableau_header[i + 1];
    });
}



function game_over(game_ender){
    document.getElementById('ecran_app').style.display = 'none';
    let message
    if (game_ender == "turns"){
        message = "Les 10 tours sont passés"
    } else {
        message = "Le joueur " + game_ender + " à gagné !"
    }
    document.getElementById('reason').innerText = message;
    moyennes = get_moyennes();
    for (let i = 0; i < model.nb_joueurs; i++){
        p = document.createElement('p');
        p.innerText = model.tableau_score[i][0] + ' : ' + moyennes[i];//BUG?
        document.getElementById('moyennes').appendChild(p);
    }
    document.getElementById('ecran_game_over').style.display = 'flex';
}
