# Checkers

## Overview

Kid-friendly implementation of classic checkers (English draughts) with educational features including hints, undo, and configurable AI difficulty.

## How to Play

- Standard 8x8 checkerboard with red and black pieces
- Pieces move diagonally forward on dark squares only
- Capture by jumping over an opponent's piece diagonally
- Captures are mandatory when available
- Multiple jumps are allowed in a single turn (must take all available jumps)
- Pieces reaching the opposite end are promoted to Kings
- Kings can move and capture both forward and backward
- Win by capturing all opponent pieces or blocking all their moves

## Controls

- Click a piece to select it (valid moves shown as blue circles)
- Click a highlighted square to move
- Red circles indicate mandatory captures
- Yellow square shows selected piece and last move
- Purple square shows hint location

## Scoring

Win/loss based on capturing all opponent pieces or blocking all their moves.

## Game Options

- Game mode: Human vs Human, Human vs Computer
- AI difficulty: Easy, Medium, Hard
- Hints: Enable/disable move suggestions (educational feature)
- Dark mode toggle

## Features

- 3 AI difficulty levels (minimax with alpha-beta pruning)
- Hint system for learning
- Mandatory capture enforcement
- Multi-jump sequences
- Undo move capability
- Piece and king tracking
- Removed piece display
- Dark/light mode
