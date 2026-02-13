# Golf Card Game

## Overview

A digital implementation of "Golf" (also known as "Play Nine") where players manage a 4x2 grid of cards across 9 holes, trying to achieve the lowest score.

## How to Play

- 2-6 players (mix of human and computer)
- Each player gets 8 cards in a 4x2 grid, face-down
- At the start of each hole, flip 2 cards
- On your turn: draw from the draw pile OR pick up from the discard pile
- Then either: replace one of your cards with the drawn card, OR discard it and flip a face-down card
- If you picked from the discard pile, you must replace a card (cannot discard back)
- When one player reveals all cards, other players get one final turn
- After 9 holes, the player with the lowest total score wins

## Controls

Mouse clicks throughout:

- Click cards to flip or select them
- Click the draw pile or discard pile to draw
- Click action buttons to confirm moves

## Scoring

- Cards are worth face value (0-12 points)
- Special "Hole-In-One" cards are worth -5 points
- Matching vertical pairs (same column, same value): both cancel to 0 points
- Column matching bonuses: 2 matching columns = -10, 3 matching columns = -15, 4 matching columns = -20
- Collecting all four -5 cards: additional -10 bonus (total -30 for all four)

## Game Options

- Player count: 2-6
- Human vs computer mix
- AI speed: slow, normal, fast (affects how quickly computer players take turns)
- Dark mode toggle

## Features

- Persistent game state via localStorage
- Smooth card flip animations
- Detailed scorecard
- 9-hole gameplay with running totals
- Dark/light mode
