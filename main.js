var previous_states_json = [];

var model = {
    nb_joueurs: 1,
    tour: 1,
    joueur: 1,
    fleche: 1,
    tableau_header: [25,20,19,18,17,16,15],
    tableau_score: [],
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
        scores.push(player[1]);
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
    for (let index = 4; index < model.tableau_score[0].length; index++) {
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
            model.tableau_header[i + 1] = new_number;
        }
    }
}

function handler_valider(){
    store_state(model);
    let multiplier = document.querySelector('#box_radio_multiplier > input[type="radio"]:checked').value;
    let touche = document.querySelector('#box_radio_touche > input[type="radio"]:checked').value;
    multiplier = parseInt(multiplier);
    touche = parseInt(touche);
    //Pas de triple pour le bull-eye
    if (touche == 2 && multiplier == 3) {   
        multiplier = 2;
    }
    let i_joueur = model.joueur - 1;
    for (let index = 0; index < multiplier ; index++) {//Pour chaque touche
        let does_hit = false;
        // +1 pour compenser l'ajout de la cellule vide affichant le joueur actif
        if (model.tableau_score[i_joueur][touche + 1] < 3){
            model.tableau_score[i_joueur][touche +1] += 1;
            does_hit = true;
        } else {
            for (const joueur of model.tableau_score) {
                if (joueur[touche + 1] != 3) {
                    let i_touche = touche - 2;
                    joueur[2] += model.tableau_header[i_touche];
                    does_hit = true;
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

function start_game(){
    nb_joueurs = document.getElementById('select_nb_joueurs').value; 
    document.getElementById('ecran_accueil').style.display = "none";
    document.getElementById('ecran_app').style.display = "flex";
    document.getElementById('button_rotate').style.display = "inline-table"
    for (let i = 0; i < nb_joueurs; i++) {
        //Model
        let n_joueur = "J" + (i + 1).toString();
        model.tableau_score.push([null,n_joueur,0,0,0,0,0,0,0,0]);
        model.total_touches.push(0);
        //Vue horizontale
        new_line = document.createElement('tr');
        for (let c = 0; c < model.tableau_score[0].length; c++) {
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
    document.getElementById("header_tableau_vertical").childNodes[model.joueur].classList.toggle('active_player_vertical');
    

    //Affichage du tour en cours
    document.getElementById('tour').innerText = "Tour : " + model.tour;
    
    //Affichage des flèches restantes
    refresh_dart_counter();
    
    //Actualisation du corps du tableau
    let table_content = document.querySelectorAll('#tableau_scores_body > tr');
    table_content.forEach((row , i) => {
        row.childNodes.forEach((cell , j) => {
            if (j < 3) {
                cell.innerText = model.tableau_score[i][j];
            } else {
                cell.childNodes.forEach((dot, d) => {
                    if (d < model.tableau_score[i][j]){
                        dot.classList.add('active');
                    }
                })   
            }
        });
    });

    //Actualisation du tableau vertical
    document.querySelectorAll('#tableau_scores_vertical_body > tr').forEach((line, i) => {
        for (let j = 1; j < line.children.length; j++) {
            if (i < 3){
                line.children[j].innerHTML = model.tableau_score[j - 1][i];            
            } else {
                line.children[j].childNodes.forEach((dot, d) => {
                    if (d < model.tableau_score[j - 1][i]){
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
    let random_buttons = document.getElementsByClassName('label_button')
    for (let i = 0; i < random_buttons.length; i++) {
        random_buttons[i].innerText = model.tableau_header[i + 1];
    }
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
