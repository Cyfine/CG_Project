# CG_Project

## Game description: 
We plan to develop a 3D car game, very similary to https://tympanus.net/Tutorials/TheAviator/, except that we need to change the viewing direction.
The camera is placecd above the planet, look down the planet. A big planet is keeping rotating around itself, while the car only move 
along the x-axis and y-axis. The car moves forward (without chaning its z-coordinate), **simulated** by letting the planet rotating backward.

## Basic functionalities (do these first):
1. find a planet/racing track model, and let that rotate.
2. find a car model that can go up/down, left/right.
3. design some barriers on and above planet, could be randomly generated, and be able to detect collision with car.
4. a sun that slowly rotate around the planet, apply Phong reflection model first.

## Additional features (may add later): 
1. sound: crashes and background music...
2. shaders: enable a button that can switch different shading model and effect.
3. blue flame: when the car leave the ground, we append a blue flame at the back of the car.
4. obvious hitting effect: like what we see in the sample project.

## Coding part:
https://github.com/yakudoo/TheAviator
Refer to the coding logic of this project as it is very clear.

https://tympanus.net/codrops/2016/04/26/the-aviator-animating-basic-3d-scene-threejs/
A website that introduce each step for creating this game.
