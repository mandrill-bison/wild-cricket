var previous_states = []

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
        touches = joueur.slice(2)
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
    refreshApp(model);
}

function tour_suivant(){
    model.tour += 1;
    if (model.tour > 10){
        game_over("turns");
    };
    refreshApp(model);
}

function fleche_suivante(){
    previous_states.unshift({...model})
    model.fleche += 1;
    model.total_touches[model.joueur - 1].total_darts += 1;
    test_game_over();
    if (model.fleche > 3){
        model.fleche = 1;
        joueur_suivant();
    };
}

function handler_miss(){
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
    for (let index = 3; index < model.tableau_score[0].length; index++) {
        let colone = [];
        for (const joueur of model.tableau_score) {
            colone.push(joueur[index]);
        }
        colones.unshift(colone);
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
    let multiplier = document.querySelector('#box_radio_multiplier > input[type="radio"]:checked').value;
    let touche = document.querySelector('#box_radio_touche > input[type="radio"]:checked').value;
    multiplier = parseInt(multiplier);
    touche = parseInt(touche);
    //Pas de triple pour le bull-eye
    if (touche == 2 && multiplier == 3) {   
        multiplier = 2;
    }
    let i_joueur = model.joueur - 1;
    for (let index = 0; index < multiplier ; index++) {
        let does_hit = false;
        if (model.tableau_score[i_joueur][touche] < 3){
            model.tableau_score[i_joueur][touche] += 1;
            does_hit = true;
        } else {
            for (const joueur of model.tableau_score) {
                if (joueur[touche] != 3) {
                    let i_touche = touche - 2;
                    joueur[1] += model.tableau_header[i_touche];
                    does_hit = true;
                }
            }
        }
        if (does_hit) {
            model.total_touches[model.joueur - 1] += 1;
        }
    }
    fleche_suivante();
    refreshApp(model);
}

function handler_undo(){
    if (previous_states.length) {
        model = {...previous_states[0]};
        previous_states.shift();
        refreshApp(model);
    }
}

function start_game(){
    nb_joueurs = document.getElementById('select_nb_joueurs').value; 
    document.getElementById('ecran_accueil').style.display = "none";
    document.getElementById('ecran_app').style.display = "flex";
    for (let i = 0; i < nb_joueurs; i++) {
        let n_joueur = "J" + (i + 1).toString();
        model.tableau_score.push([null,n_joueur,0,0,0,0,0,0,0,0]);
        model.total_touches.push(0);
        new_line = document.createElement('tr');
        for (let c = 0; c < model.tableau_score[0].length; c++) {
            cell = document.createElement('td');
            cell.innerText = "0";
            new_line.appendChild(cell);
        }
        document.getElementById('tableau_scores_body').appendChild(new_line);
    }
    model.nb_joueurs = nb_joueurs;
    init_randomize_header();
    refreshApp(model);
}


function refreshApp(model){
    let lines = document.querySelectorAll('#tableau_scores_body > tr');
    lines.forEach(line => {
        line.classList.remove('active_player');
    })
    lines[model.joueur - 1].classList.toggle('active_player');
    document.getElementById('tour').innerText = "Tour : " + model.tour;
    document.getElementById('fleche').innerText = "Fleche : " + model.fleche;
    let tableau_score = document.querySelectorAll('#tableau_scores_body > tr');
    tableau_score.forEach((row , i) => {
        row.childNodes.forEach((cell , j) => {
            cell.innerText = model.tableau_score[i][j];
        });
    });
    let random_header = document.querySelectorAll('#tableau_scores th.header_colone_random');
    random_header.forEach((cell, i ) => {
        cell.innerText = model.tableau_header[i + 1];// index + 1 pour ignorer la valeur 25 du bull-eye
    });
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
        console.log('joueur : ',model.tableau_score[i][0])
        p = document.createElement('p');
        p.innerText = model.tableau_score[i][0] + ' : ' + moyennes[i];
        document.getElementById('moyennes').appendChild(p);
    }
    document.getElementById('ecran_game_over').style.display = 'flex';
}
