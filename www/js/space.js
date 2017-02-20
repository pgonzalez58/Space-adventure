var game = null;

var Space = {
	vr: {
		width: 640,
		height: 363,
		player: null,
		aliens: null,
		bullets: null,
		bulletTime: 0,
		explosions: null,
		fails: null,
		starfield: null,
		score: 0,
		scoreString: '',
		scoreText: null,
		lives: null,
		enemyTimer: 0,
		asteroidTimer: 0,
		stateText: null,
		typesAsteroid: [ 'asteroid1', 'asteroid2', 'asteroid3', 'asteroid4', 'asteroid5', 'asteroid6', 'asteroid7', 'asteroid8', 'asteroid9', 'asteroid10', 'asteroid11' ],
		asteroids: null,
		ready: false,
		countdown: null,
		difficulty: 0,
		aliensSpeed: [4000, 3000, 2000, 1000],
		asteroidsSpeed: [2500, 2000, 1500, 1000],
		cursors: null,
		fireButton: null
	},
	
	init: function(){
		game.state.add("Game", Space.Game);
		game.state.start("Game");
	}
};

Space.Game = function(game){};

Space.Game.prototype = {
	preload: function(){
		game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		game.scale.forceOrientation(true, false);
		game.scale.enterIncorrectOrientation.add(this.handleIncorrect);
		game.scale.leaveIncorrectOrientation.add(this.handleCorrect);
		
		game.load.image('bullet', 'img/bullet.png');
		game.load.spritesheet('invader', 'img/invader32x32x4.png', 32, 32);
		game.load.image('ship', 'img/player.png');
		game.load.spritesheet('kaboom', 'img/explode.png', 128, 128);
		game.load.spritesheet('fail', 'img/explode2.png', 26, 26);
		game.load.image('starfield', 'img/starfield.png');
		
		game.load.image('asteroid1', 'img/asteroid1.png');
		game.load.image('asteroid2', 'img/asteroid2.png');
		game.load.image('asteroid3', 'img/asteroid3.png');
		game.load.image('asteroid4', 'img/asteroid4.png');
		game.load.image('asteroid5', 'img/asteroid5.png');
		game.load.image('asteroid6', 'img/asteroid6.png');
		game.load.image('asteroid7', 'img/asteroid7.png');
		game.load.image('asteroid8', 'img/asteroid8.png');
		game.load.image('asteroid9', 'img/asteroid9.png');
		game.load.image('asteroid10', 'img/asteroid10.png');
		game.load.image('asteroid11', 'img/asteroid11.png');
	},

	create: function(){
		game.physics.startSystem(Phaser.Physics.ARCADE);
		
		//  The scrolling starfield background
		Space.vr.starfield = game.add.tileSprite(0, 0, Space.vr.width, Space.vr.height, 'starfield');
		
		//  Our bullet group
		Space.vr.bullets = game.add.group();
		Space.vr.bullets.enableBody = true;
		Space.vr.bullets.physicsBodyType = Phaser.Physics.ARCADE;
		Space.vr.bullets.createMultiple(30, 'bullet');
		Space.vr.bullets.setAll('anchor.x', 0.5);
		Space.vr.bullets.setAll('anchor.y', 1);
		Space.vr.bullets.setAll('outOfBoundsKill', true);
		Space.vr.bullets.setAll('checkWorldBounds', true);
		
		//  The hero!
		Space.vr.player = game.add.sprite(50, game.world.centerY, 'ship');
		Space.vr.player.anchor.setTo(0.5, 0.5);
		game.physics.enable(Space.vr.player, Phaser.Physics.ARCADE);
		Space.vr.player.body.collideWorldBounds = true;
		
		//  The baddies!
		Space.vr.aliens = game.add.group();
		Space.vr.aliens.enableBody = true;
		Space.vr.aliens.physicsBodyType = Phaser.Physics.ARCADE;
		Space.vr.aliens.createMultiple(30, 'invader');
		Space.vr.aliens.callAll('animations.add', 'animations', 'fly', [ 0, 1, 2, 3 ], 20, true);
		Space.vr.aliens.callAll('animations.play', 'animations', 'fly');
		Space.vr.aliens.setAll('anchor.x', 0.5);
		Space.vr.aliens.setAll('anchor.y', 0.5);
		Space.vr.aliens.setAll('outOfBoundsKill', true);
		Space.vr.aliens.setAll('checkWorldBounds', true);
			
		// The asteroids
		Space.vr.asteroids = game.add.group();
		Space.vr.asteroids.enableBody = true;
		Space.vr.asteroids.physicsBodyType = Phaser.Physics.ARCADE;
		Space.vr.asteroids.setAll('outOfBoundsKill', true);
		Space.vr.asteroids.setAll('checkWorldBounds', true);
		
		//  The score
		Space.vr.scoreString = 'Score : ';
		Space.vr.scoreText = game.add.text(10, 10, Space.vr.scoreString + Space.vr.score, { font: '34px Arial', fill: '#fff' });
		
		//  Lives
		Space.vr.lives = game.add.group();
		game.add.text(game.world.width - 100, 10, 'Lives : ', { font: '34px Arial', fill: '#fff' });
		
		for (var i = 0; i < 3; i++) 
		{
			var ship = Space.vr.lives.create(game.world.width - 85 + (30 * i), 60, 'ship');
			ship.anchor.setTo(0.5, 0.5);
			ship.alpha = 0.4;
		}
		
		//  An explosion pool
		Space.vr.explosions = game.add.group();
		Space.vr.explosions.createMultiple(30, 'kaboom');
		Space.vr.explosions.forEach(this.setupInvader, this);
		
		//  An fail pool
		Space.vr.fails = game.add.group();
		Space.vr.fails.createMultiple(30, 'fail');
		Space.vr.fails.forEach(this.setupAsteorid, this);
		
		//  Text
		Space.vr.stateText = game.add.text(game.world.centerX, game.world.centerY, ' ', { font: '84px Arial', fill: '#fff' });
		Space.vr.stateText.anchor.setTo(0.5, 0.5);
		Space.vr.stateText.visible = true;
		
		// Countdown
		Space.vr.countdown = game.time.create(false);
		Space.vr.countdown.add(Phaser.Timer.SECOND * 5, this.endTimer, this);
		Space.vr.countdown.start();
		
		//  And some controls to play the game with
		Space.vr.cursors = game.input.keyboard.createCursorKeys();
		Space.vr.fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		window.addEventListener("deviceorientation", this.handleOrientation, true);
		game.input.onTap.add(this.fireBullet, this);
	},
	
	handleIncorrect: function(){
     	if(!game.device.desktop){
     		document.getElementById("portrait").style.display="block";
     	}
	},

	handleCorrect: function(){
		if(!game.device.desktop){
			document.getElementById("portrait").style.display="none";
		}
	},
	
	handleOrientation: function(e) {
		// Device Orientation API
		var y = e.gamma;
		Space.vr.player.body.velocity.y = y * -30;
	},
	
	endTimer: function() {
        // Stop the timer when the delayed event triggers
        Space.vr.countdown.stop();
		Space.vr.stateText.visible = false;
		Space.vr.ready = true;
		Space.vr.enemyTimer = game.time.now + Space.vr.aliensSpeed[Space.vr.difficulty];
    },
	
	setupInvader: function(invader){
		invader.anchor.x = 0.5;
		invader.anchor.y = 0.5;
		invader.animations.add('kaboom');
	},
	
	setupAsteorid: function(asteroid){
		asteroid.anchor.x = 0.5;
		asteroid.anchor.y = 0.5;
		asteroid.animations.add('fail');
	},
	
	fireBullet: function(){
		if(Space.vr.player.alive){
			//  To avoid them being allowed to fire too fast we set a time limit
			if (game.time.now > Space.vr.bulletTime){
				//  Grab the first bullet we can from the pool
				bullet = Space.vr.bullets.getFirstExists(false);

				if (bullet){
					//  And fire it
					bullet.reset(Space.vr.player.x + 8, Space.vr.player.y + 3);
					bullet.body.velocity.x = 400;
					Space.vr.bulletTime = game.time.now + 200;
				}
			}
		}
	},
	
	collisionHandler: function(bullet, alien){
		bullet.kill();
		alien.kill();

		//  Increase the score
		Space.vr.score += 20;
		Space.vr.scoreText.text = Space.vr.scoreString + Space.vr.score;

		//  And create an explosion :)
		var explosion = Space.vr.explosions.getFirstExists(false);
		explosion.reset(alien.body.x, alien.body.y);
		explosion.play('kaboom', 30, false, true);
		
		if (Space.vr.score >= 1000){
			Space.vr.difficulty = 3;
		}else if (Space.vr.score >= 500){
			Space.vr.difficulty = 2;
		}else if (Space.vr.score >= 100){
			Space.vr.difficulty = 1;
		}
	},
	
	collisionBlockedHandler:function(bullet, asteroid){
		bullet.kill();
		
		//  And create an explosion :)
		var explosion = Space.vr.fails.getFirstExists(false);
		explosion.reset(asteroid.body.x, asteroid.body.y);
		explosion.play('fail', 30, false, true);
	},
	
	objectHitsPlayer: function(player, object){
		object.kill();
		live = Space.vr.lives.getFirstAlive();

		if (live){
			live.kill();
		}

		//  And create an explosion :)
		var explosion = Space.vr.explosions.getFirstExists(false);
		explosion.reset(Space.vr.player.body.x, Space.vr.player.body.y);
		explosion.play('kaboom', 30, false, true);

		// When the player dies
		if (Space.vr.lives.countLiving() < 1){
			Space.vr.player.kill();
			Space.vr.aliens.callAll('kill');
			Space.vr.asteroids.callAll('kill');

			Space.vr.stateText.text = " GAME OVER \n Tap to restart";
			Space.vr.stateText.visible = true;

			//the "click to restart" handler
			game.input.onTap.addOnce(this.restart,this);
		}
	},
	
	restart: function(){
		//resets the life count
		Space.vr.lives.callAll('revive');

		//revives the player
		Space.vr.player.revive();
		
		Space.vr.difficulty = 0;
		Space.vr.score = 0;
		Space.vr.scoreText.text = Space.vr.scoreString + Space.vr.score;
		Space.vr.ready = false;
		Space.vr.countdown.add(5000, this.endTimer, this);
		Space.vr.countdown.start();
	},
	
	enemyShow: function(){		
		alien = Space.vr.aliens.getFirstExists(false);

		if (alien){
			alien.reset(Space.vr.width, Math.floor(Math.random() * Space.vr.height));

			game.physics.arcade.moveToObject(alien, Space.vr.player, 120);
			Space.vr.enemyTimer = game.time.now + Space.vr.aliensSpeed[Space.vr.difficulty];
		}
	},
	
	asteroidShow: function(){
		var random = game.rnd.integerInRange(0, Space.vr.typesAsteroid.length-1);
		var asteroid = Space.vr.asteroids.create(0, 0, Space.vr.typesAsteroid[random]);
		asteroid.anchor.setTo(0.5, 0.5);
		
		if (asteroid){
			var y = Math.floor(Math.random() * Space.vr.height);
			asteroid.reset(Space.vr.width, y);
			asteroid.body.angularVelocity = 25;

			var velocity = (Math.floor(Math.random() * 25) + 5 ) * 10;
			game.physics.arcade.moveToObject(asteroid, {x:0, y:y}, velocity);
			Space.vr.asteroidTimer = game.time.now + Space.vr.asteroidsSpeed[Space.vr.difficulty];
		}
	},
	
	update: function() {
		//  Scroll the background
		Space.vr.starfield.tilePosition.x -= 2;

		if(Space.vr.ready){
			if(Space.vr.player.alive){
				if(Space.vr.cursors.up.isDown){
					Space.vr.player.body.velocity.y = -200;
				}else if (Space.vr.cursors.down.isDown){
					Space.vr.player.body.velocity.y = 200;
				}
				
				if (Space.vr.fireButton.isDown){
					this.fireBullet();
				}
				
				if (game.time.now > Space.vr.enemyTimer){
					this.enemyShow();
				}
				
				if (game.time.now > Space.vr.asteroidTimer){
					this.asteroidShow();
				}
				
				//  Run collision
				game.physics.arcade.overlap(Space.vr.bullets, Space.vr.asteroids, this.collisionBlockedHandler, null, this);
				game.physics.arcade.overlap(Space.vr.bullets, Space.vr.aliens, this.collisionHandler, null, this);
				game.physics.arcade.overlap(Space.vr.asteroids, Space.vr.player, this.objectHitsPlayer, null, this);
				game.physics.arcade.overlap(Space.vr.aliens, Space.vr.player, this.objectHitsPlayer, null, this);
			}
		}
		
	},
	
	render: function() {
		if(Space.vr.countdown.running) {
			Space.vr.stateText.text = 'Tap to fire\nReady? ' + (Space.vr.countdown.duration / 1000).toFixed(0);
		}
	}
};

if ('addEventListener' in document) {
    document.addEventListener('deviceready', function() {
		game = new Phaser.Game(Space.vr.width, Space.vr.height, Phaser.CANVAS, 'phaser');
        Space.init();
    }, false);
}