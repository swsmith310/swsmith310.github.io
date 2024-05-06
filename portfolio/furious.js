const ff_main = engine.init("furious");
engine.setup_window(ff_main);

let ff_timer = 90;
let ff_tick = 0;

function ff_init_fighter(x) {
    return {
        x,
        y: 300,
        w: 64,
        h: 128,
        dx: 0,
        dx_r: 0,
        dx_l: 0,
        dy: 0,
        facingRight: true,
        hp: 100,
        max_hp: 100,
        hitstun: 0,
        fist: null,
        punch: function(duration, damage) {
            const x = this.facingRight ? this.x + this.w : this.x - 16;
            return {
                x,
                y: this.y + 32,
                w: 16,
                h: 16,
                active: duration,
                draw: function() {
                    if (this.active > 0)
                        engine.draw(ff_main.ctx, this)
                },
                update: function(self, enemy) {
                    if (this.active > 0) {
                        if (!enemy.hitstun && engine.aabb(this, enemy)) {
                            enemy.hp -= damage;
                            enemy.hitstun = 32;
                        }
                        this.active--;
                    }
                    this.x += self.dx;
                    this.y += self.dy;
                }
            }
        },
        draw: function() { 
            engine.draw(ff_main.ctx, this); 
            if (this.fist)
                this.fist.draw();
        },
        update: function(enemy) { 
            if (this.hitstun > 0) this.hitstun--;
            this.dx = this.dx_l + this.dx_r;
            if (this.fist)
                this.fist.update(this, enemy);
            if (!this.hitstun)
                engine.move(this); 
        }
    }
}

const ff_player = ff_init_fighter(engine.SCREEN_WIDTH / 6);
const ff_enemy = ff_init_fighter(engine.SCREEN_WIDTH - engine.SCREEN_WIDTH / 6 - 64);

function ff_draw_health_bars() {
    // p1
    ff_main.ctx.fillStyle = "#00800080";
    ff_main.ctx.fillRect(32, 32, ff_player.max_hp * 2, 32);
    ff_main.ctx.fillStyle = "#008000FF";
    ff_main.ctx.fillRect(32, 32, ff_player.hp * 2, 32)
    // p2
    ff_main.ctx.fillStyle = "#00800080";
    ff_main.ctx.fillRect(engine.SCREEN_WIDTH - ff_enemy.max_hp * 2 - 32, 32, ff_enemy.max_hp * 2, 32);
    ff_main.ctx.fillStyle = "#008000FF";
    ff_main.ctx.fillRect(engine.SCREEN_WIDTH - ff_enemy.max_hp * 2- 32, 32, ff_enemy.hp * 2, 32)
}

function ff_enemyAI() {
    if (ff_enemy.hitstun) return;
    if (ff_player.hitstun > 0) {
        if (ff_enemy.facingRight) {
            ff_enemy.dx_l = -5;
            ff_enemy.dx_r = 0;
        } else {
            ff_enemy.dx_r = 5;
            ff_enemy.dx_l = 0;
        }
    } else {
        if (Math.abs(ff_player.x + ff_player.w - ff_enemy.x) < 8 ) {
            ff_enemy.fist = ff_enemy.punch(16, 5);
        }
        if (Math.abs(ff_enemy.x + ff_enemy.w - ff_player.x) < 8) {
            ff_enemy.fist = ff_enemy.punch(16, 5);
        }
        if (ff_player.x + ff_player.w + 8 < ff_enemy.x) {
            ff_enemy.dx_l = -5;
            ff_enemy.dx_r = 0;
            ff_enemy.facingRight = false;
        }
        else if (ff_player.x > ff_enemy.x + ff_enemy.w + 8) {
            ff_enemy.dx_r = 5;
            ff_enemy.dx_l = 0;
            ff_enemy.facingRight = true;
        }
        else { 
            ff_enemy.dx_r = 0;
            ff_enemy.dx_l = 0;
        }
    }
}

const ff_keydown = (e) => {
    if (!ff_player.hitstun) {
        if (e.code == "KeyD") {
            ff_player.dx_r = 5;
            ff_player.facingRight = true;
        }
        if (e.code == "KeyA") {
            ff_player.dx_l = -5;
            ff_player.facingRight = false;
        }
        if (e.code == "Space")
            ff_player.fist = ff_player.punch(16, 5);
    }
}
const ff_keyup = (e) => {
    if (e.code == "KeyD")
        ff_player.dx_r = 0;
    if (e.code == "KeyA")
        ff_player.dx_l = 0;
}
engine.kb_ctrl(ff_main, ff_keydown, ff_keyup);

setInterval(() => {
    if (!ff_main.open || ff_timer < 0) return;
    if (ff_tick++ % 60 == 0) ff_timer--;
    ff_player.update(ff_enemy);
    ff_enemyAI();
    ff_enemy.update(ff_player);
}, engine.TICK)

setInterval(() => {
    if (!ff_main.open) return;
    if (ff_timer < 0 || ff_player.hp <= 0 || ff_enemy.hp <= 0) return engine.gameOver(ff_main.ctx);
    engine.bg(ff_main.ctx);
    ff_main.ctx.fillStyle = "#008000FF";
    ff_main.ctx.fillText(ff_timer, engine.SCREEN_WIDTH / 2 - 16, 56);
    ff_player.draw();
    ff_enemy.draw();
    ff_draw_health_bars();
}, engine.TICK)