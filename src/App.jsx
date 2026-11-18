import React,{ useState, useRef, useEffect} from 'react';
const CARDSTATE = {
  UNFLIPPED: 'unflipped',
  FLIPPED: 'flipped',
  MATCHED: 'matched',
  WON: 'won'
};

const BOARDSIZE = {
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE'
}

const createCard = (id) => {
  return {
    id,
    state: CARDSTATE.UNFLIPPED,
    value: null
  }
}

const buildDeck = (size) => {
  return Array.from({ length: size }, (_, index) => createCard(index));
};


function App() {
  const [cards, setCards] = useState(buildDeck);
  const [isChecking, setIsChecking] = useState(false);
  const [boardSize, setBoardSize] = useState(BOARDSIZE.MEDIUM);
  const isGameWon = useRef(false);
  const gameId = useRef(null);

  const startGame = async (boardSize) => {
    const params = new URLSearchParams({
      boardSize : boardSize
    })
    const response = await fetch(`http://localhost:8080/api/game/start?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    gameId.current = data.gameId;
    setCards(buildDeck(data.boardSize));
  }


  const onFlip = async (index) => {
    if (isChecking){
      return;
    }
    const selectedCard = cards[index];
    const params = new URLSearchParams({
      cardId: index
    })
    const response = await fetch(`http://localhost:8080/api/game/${gameId.current}/flip?${params}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log("BACKEND JSON:", data);

    if (data.result === "INVALID_MOVE"){
      return;
    }

    const previousFlipped = cards.find(card => card.state === CARDSTATE.FLIPPED);

    setCards(prevCards => {
         return prevCards.map((card, i) => {
          return index === i ? {...card, state: CARDSTATE.FLIPPED, value: data.revealedCardValue} : card
         });
    });

    if (!previousFlipped){
      return;
    }

    if (data.result === "MATCH_FOUND"){
      setIsChecking(true);
      setTimeout(() => {
        setCards(prevCards => {
          return prevCards.map(card =>
            (card.id === previousFlipped.id || card.id === index) ? {...card, state: CARDSTATE.MATCHED} : card
          )
        });
        setIsChecking(false);
      }, 500);
    }
    else if (data.result === "PLAYER_ONE_WINS" || data.result === "PLAYER_TWO_WINS" || data.result === "DRAW"){
      setIsChecking(true);
      setTimeout(() => {
        setCards(prevCards => {
          return prevCards.map(card =>
            (card.id === previousFlipped.id || card.id === index) ? {...card, state: CARDSTATE.MATCHED} : card
          )
        });
      }, 500);

      setTimeout(() => {
        setCards(prevCards => {
          return prevCards.map(card =>
            ({...card, state: CARDSTATE.WON})
          )
        });
      }, 1000);
    }
    else{
      setIsChecking(true);
      setTimeout(() => {
        setCards(prevCards => {
          return prevCards.map(card =>
            (card.id === previousFlipped.id || card.id === index) ? {...card, state: CARDSTATE.UNFLIPPED, value: null} : card
          )
        });
        setIsChecking(false);
      }, 500);
  
    }
  };

  return( 
    <div className="background">
      <div className="container">
        {cards.map((item, index) => (
          <div key={index} className={`card ${item.state}`} onClick={() => onFlip(index)}>
            {(item.state === CARDSTATE.MATCHED || item.state === CARDSTATE.FLIPPED)? item.value : ""}
          </div>
        ))}
      </div>
      <select value={boardSize} onChange={(e) => setBoardSize(e.target.value)}>
        <option value={BOARDSIZE.SMALL}>Small</option>
        <option value={BOARDSIZE.MEDIUM}>Medium</option>
        <option value={BOARDSIZE.LARGE}>Large</option>
      </select>
      <button onClick={() => startGame(boardSize)}>Start Game</button>
      
    </div> 
  )
  
}

export default App
