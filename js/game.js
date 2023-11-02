const grid = document.querySelector('.grid');
const spanPlayer = document.querySelector('.player');
const timer = document.querySelector('.timer');

const fighters = [
    'Gwen_Soul_Fighter_Card',
    'Neeko_e_Nidalee_Soul_Fighter_Card',
    'Nidalee_Soul_Fighter_Card',
    'Samira_Soul_Fighter_Card',
    'Viego_Soul_Fighter_Card', 
];

const createElement = (tag, className) => {
    const element = document.createElement(tag);
    element.className = className;
    return element;
}

let firstCard = '';
let secondCard = '';

const checkEndGame = () => {
    const disabledCards = document.querySelectorAll('.disabled-card');

    if (disabledCards.length == 20) {
        clearInterval(this.loop);
        alert(`BOAAAAA ${spanPlayer.innerHTML}! você conseguiu perder ${timer.innerHTML} segundos da sua vida.`);
        window.location.href = '../index.html'
    }
}

const checkCards = () => {
    const firstFighter = firstCard.getAttribute('data-fighter');
    const secondFighter = secondCard.getAttribute('data-fighter');

    if (firstFighter == secondFighter) {

        firstCard.firstChild.classList.add('disabled-card');
        secondCard.firstChild.classList.add('disabled-card');

        firstCard = '';
        secondCard = '';

        checkEndGame();
        
    } else {
        
        setTimeout(() => {
            
            firstCard.classList.remove('reveal-card');
            secondCard.classList.remove('reveal-card');

            firstCard = '';
            secondCard = '';
        }, 500);
        
    }
}

const revealCard = ( { target } ) => {

    if (target.parentNode.className.includes('reveal-card')) {
        return;
    }

    if (firstCard == '') {
        target.parentNode.classList.add('reveal-card');
        firstCard = target.parentNode;
    } else if (secondCard == '') {
        target.parentNode.classList.add('reveal-card');
        secondCard = target.parentNode;

        checkCards();
    }
    
}

const createCard = (fighter) => {

    const card = createElement('div', 'card');
    const front = createElement('div', 'face front');
    const back = createElement('div', 'face back');

    front.style.backgroundImage = `url('../images/${fighter}.png')`;

    card.appendChild(front);
    card.appendChild(back);

    card.addEventListener('click', revealCard);
    card.setAttribute('data-fighter', fighter);

    return card;

}

const loadGame = () => {

    const duplicateFighters = [ ...fighters, ...fighters, ...fighters, ...fighters ];

    const shuffledArray = duplicateFighters.sort( () => Math.random() - 0.5 );

    shuffledArray.forEach((fighter) => {

        const card = createCard(fighter);
        grid.appendChild(card);
    });
}

const startTimer = () => {

    this.loop = setInterval(() => {
        const currentTime = +timer.innerHTML;
        timer.innerHTML = currentTime +1;
    }, 1000);

}

window.onload = () => {
    
    const playerName = localStorage.getItem('player');
    spanPlayer.innerHTML = playerName;
    startTimer();
    loadGame();
}

