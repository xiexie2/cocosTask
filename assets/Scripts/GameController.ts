import { _decorator, Component, Node, Prefab, resources, instantiate, Vec3, EventTouch, Button, tween, Tween, SpriteFrame, Sprite, UITransform, screen, view, AudioSource, AudioClip, ResolutionPolicy } from 'cc';
import { sp } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {
    @property(Node)
    mainUI: Node = null!;
    
    @property(Node)
    bg: Node = null!;
    
    @property(Node)
    body: Node = null!;
    
    @property(Node)
    hand: Node = null!;
    
    @property(Node)
    okButton: Node = null!;
    
    @property(Node)
    noButton: Node = null!;
    
    @property(Node)
    xiangshang: Node = null!;
    
    @property(Node)
    dhk: Node = null!;
    
    @property(Node)
    girl: Node = null!;
    
    @property(Node)
    dianti: Node = null!;
    
    @property(Node)
    zjhx: Node = null!;
    
    @property(Node)
    qiang: Node = null!;
    
    @property(Node)
    dimian: Node = null!;
    
    @property(Node)
    yinzi: Node = null!;
    
    @property(Node)
    touXiang: Node = null!;
    
    @property(Node)
    nameNode: Node = null!;
    
    @property(Node)
    big: Node = null!;
    
    @property(Node)
    heimu: Node = null!;
    
    @property(Node)
    yz: Node = null!;
    
    @property(Node)
    jianbian: Node = null!;
    
    @property(Node)
    frist: Node = null!;

    @property(Node)
    end: Node = null!;

    private cachedTouXiang: { [key: number]: SpriteFrame } = {};
    private cachedName: { [key: string]: SpriteFrame } = {};
    private currentNameIndex: number = -1;
    private bodyPrefabCache: { [key: number]: Prefab | null } = {};
    private bodyLoadingPromises: { [key: number]: Promise<Prefab | null> } = {};

    @property(Prefab)
    body1Prefab: Prefab = null!;
    
    private currentBodyIndex: number = 1;
    private bodySequenceIndex: number = 1;
    private currentBody: Node = null!;
    private bgChildrenPositions: Map<string, Vec3> = new Map();
    private bodyPosition: Vec3 = new Vec3();
    private qiangPosition: Vec3 = new Vec3();
    private dimianPosition: Vec3 = new Vec3();
    private yinziPosition: Vec3 = new Vec3();
    private isMoving: boolean = false;
    private movePhase: number = 0;
    private moveSpeed: number = 0;
    private maxSpeed: number = 2000;
    private fastSpeed: number = 4000;
    private acceleration: number = 3000;
    private deceleration: number = 1500;
    private bgHeight: number = 1334;
    private moveDistance: number = 0;
    private totalMoveDistance: number = 0;
    private bounceDistance: number = 50;
    private bounceDuration: number = 0.3;
    private fastLoopCount: number = 0;
    private fastLoopTotal: number = 0;
    private fastLoopPhase: boolean = false;
    private fastLoopDistance: number = 0;
    private swipeCount: number = 0;
    private maxSwipeCount: number = 9;
    private handOriginalPosition: Vec3 = new Vec3();
    private handFloatTween: Tween<Node> | null = null;
    private isLandscape: boolean = false;
    private isFirstOperation: boolean = true;
    private idleTimer: number = 0;
    private idleTimeout: number = 6;
    private lastBodyPosition: Vec3 = new Vec3();
    private hasOpenedUrl: boolean = false;
    private isFirstBodyGuided: boolean = false;
    private bgmAudioSource: AudioSource = null!;
    private readonly designWidth: number = 750;
    private readonly designHeight: number = 1334;
    
    onLoad() {
        this.applyPortraitViewport();
        this.setupEvents();
        this.setupScreenAdapter();
        this.playBackgroundMusic();
        this.preloadAllBodies();
        this.preloadAllTouXiang();
        this.preloadAllNames();
    }

    onDestroy() {
        screen.off('window-size-change', this.onScreenResize, this);
        if (typeof window !== 'undefined') {
            window.removeEventListener('resize', this.applyPortraitViewport);
            window.removeEventListener('orientationchange', this.applyPortraitViewport);
        }
    }

    setupScreenAdapter() {
        view.setDesignResolutionSize(this.designWidth, this.designHeight, ResolutionPolicy.SHOW_ALL);
        this.applyPortraitViewport();
        this.updateOrientation();
        
        screen.on('window-size-change', this.onScreenResize, this);
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', this.applyPortraitViewport);
            window.addEventListener('orientationchange', this.applyPortraitViewport);
        }
        
        console.log('Screen adapter setup complete');
    }

    onScreenResize() {
        view.setDesignResolutionSize(this.designWidth, this.designHeight, ResolutionPolicy.SHOW_ALL);
        this.applyPortraitViewport();
        const visibleSize = view.getVisibleSize();
        console.log(`Window resized to: ${visibleSize.width}x${visibleSize.height}`);
        this.updateOrientation();
    }

    updateOrientation() {
        const visibleSize = view.getVisibleSize();
        this.isLandscape = visibleSize.width > visibleSize.height;
        console.log(`Screen size: ${visibleSize.width}x${visibleSize.height}, Landscape: ${this.isLandscape}`);
    }

    private applyPortraitViewport = () => {
        view.setDesignResolutionSize(this.designWidth, this.designHeight, ResolutionPolicy.SHOW_ALL);

        if (typeof window === 'undefined' || typeof document === 'undefined') return;

        const canvas = document.getElementById('GameCanvas') as HTMLCanvasElement | null;
        if (!canvas) return;

        const topOffset = Math.max(0, canvas.getBoundingClientRect().top);
        const availableWidth = window.innerWidth;
        const availableHeight = Math.max(1, window.innerHeight - topOffset);
        const scale = Math.min(availableWidth / this.designWidth, availableHeight / this.designHeight);
        const width = Math.floor(this.designWidth * scale);
        const height = Math.floor(this.designHeight * scale);
        const frameStyle = canvas.parentElement?.style;
        const gameDivStyle = canvas.parentElement?.parentElement?.style;
        const viewWithFrameSize = view as unknown as { setFrameSize?: (width: number, height: number) => void };

        viewWithFrameSize.setFrameSize?.(width, height);
        view.setDesignResolutionSize(this.designWidth, this.designHeight, ResolutionPolicy.SHOW_ALL);

        document.documentElement.style.width = '100%';
        document.documentElement.style.height = '100%';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.style.margin = '0';
        document.body.style.overflow = 'hidden';
        document.body.style.backgroundColor = '#000';

        if (gameDivStyle) {
            gameDivStyle.width = `${width}px`;
            gameDivStyle.height = `${height}px`;
            gameDivStyle.margin = '0 auto';
            gameDivStyle.overflow = 'hidden';
        }

        if (frameStyle) {
            frameStyle.width = `${width}px`;
            frameStyle.height = `${height}px`;
            frameStyle.margin = '0 auto';
            frameStyle.overflow = 'hidden';
        }

        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.style.display = 'block';
        canvas.style.margin = '0 auto';
    };

    playBackgroundMusic() {
        console.log('Loading background music from: mp3/bgyy');
        
        resources.load('mp3/bgyy', AudioClip, (err, clip) => {
            if (err) {
                console.warn('Background music load failed, trying alternative path...');
                resources.load('mp3/bgyy/mp3', AudioClip, (err2, clip2) => {
                    if (err2) {
                        console.error('Failed to load background music from all paths:', err2);
                        return;
                    }
                    this.initAndPlayBGM(clip2);
                });
                return;
            }
            this.initAndPlayBGM(clip);
        });
    }

    initAndPlayBGM(clip: AudioClip) {
        this.bgmAudioSource = this.node.addComponent(AudioSource);
        if (this.bgmAudioSource) {
            this.bgmAudioSource.clip = clip;
            this.bgmAudioSource.loop = true;
            this.bgmAudioSource.volume = 0.5;
            this.bgmAudioSource.play();
            console.log('Background music started playing (loop)');
        }
    }

    async start() {
        await this.createBody(1);
        this.bodySequenceIndex = 2;
        this.recordPositions();
        
        if (this.currentBody) {
            this.lastBodyPosition.set(this.currentBody.getPosition());
        }
        
        this.hideAllDhkImages();
        this.updateTouXiang(1);
        this.updateNameByIndex(1);
        this.showTouXiangAndName();
        if (this.hand) {
            this.hand.active = true;
            if (!this.isFirstBodyGuided) {
                this.startHandSwipeGuide();
            } else {
                this.startHandFloat();
            }
        }
        if (this.xiangshang) this.xiangshang.active = true;
        this.startXiangshangGlow();
        
        if (this.big) this.big.active = false;
        if (this.heimu) this.heimu.active = false;
        
        this.resetIdleTimer();
    }

    startXiangshangGlow() {
        if (!this.xiangshang) return;
        
        const uiTransform = this.xiangshang.getComponent(UITransform);
        const height = uiTransform ? uiTransform.height : 100;
        
        if (this.xiangshang.children.length > 0) {
            const glowNode = this.xiangshang.children[0];
            const glowHeight = glowNode.getComponent(UITransform)?.height || 50;
            const startY = -height / 2 - glowHeight;
            const endY = height / 2 + glowHeight;
            
            glowNode.setPosition(glowNode.getPosition().x, startY, glowNode.getPosition().z);
            
            tween(glowNode)
                .to(1.5, { position: new Vec3(glowNode.getPosition().x, endY, glowNode.getPosition().z) }, { easing: 'linear' })
                .call(() => {
                    glowNode.setPosition(glowNode.getPosition().x, startY, glowNode.getPosition().z);
                })
                .union()
                .repeatForever()
                .start();
            
            console.log('Xiangshang glow animation started');
        } else {
            console.log('No glow child found under xiangshang, please add a glow sprite as child');
        }
    }


    resetIdleTimer() {
        this.idleTimer = 0;
    }

    showHandAndXiangshang() {
        console.log(`showHandAndXiangshang called, hand active: ${this.hand?.active}, xiangshang active: ${this.xiangshang?.active}`);
        
        if (!this.isFirstBodyGuided) {
            this.isFirstBodyGuided = true;
            console.log('First body guide completed, switching to normal mode');
        }
        
        if (this.hand) {
            this.hand.active = true;
            this.startHandFloat();
            console.log('Hand shown with float animation');
        } else {
            console.log('Hand node is null');
        }
        
        if (this.xiangshang) {
            this.xiangshang.active = true;
            console.log('Xiangshang shown');
        } else {
            console.log('Xiangshang node is null');
        }
    }

    hideHandAndXiangshang() {
        if (this.hand) this.hand.active = false;
        if (this.xiangshang) this.xiangshang.active = false;
        console.log('Hand and xiangshang hidden');
    }

    hideAllDhkImages() {
        if (!this.dhk) return;
        
        this.dhk.children.forEach(child => {
            child.active = false;
        });
        
        console.log('All dhk images hidden');
    }

    getBodyPrefab(index: number): Prefab | null {
        const prefabProp = this[`body${index}Prefab`] as Prefab;
        if (prefabProp) return prefabProp;

        if (this.bodyPrefabCache[index] !== undefined) {
            return this.bodyPrefabCache[index];
        }

        return null;
    }

    async getBodyPrefabAsync(index: number): Promise<Prefab | null> {
        const cached = this.getBodyPrefab(index);
        if (cached) return cached;

        if (this.bodyLoadingPromises[index]) {
            return this.bodyLoadingPromises[index];
        }

        const promise = new Promise<Prefab | null>((resolve) => {
            resources.load(`pre/body${index}`, Prefab, (err, prefab) => {
                if (!err && prefab) {
                    this.bodyPrefabCache[index] = prefab;
                    console.log(`Body${index} prefab loaded dynamically`);
                    resolve(prefab);
                } else {
                    console.error(`Failed to load body${index} prefab:`, err);
                    resolve(null);
                }
            });
        });

        this.bodyLoadingPromises[index] = promise;
        return promise;
    }

    preloadAllBodies() {
        for (let i = 2; i <= 9; i++) {
            this.getBodyPrefabAsync(i);
        }
    }

    preloadAllTouXiang() {
        resources.loadDir('ui/头像', SpriteFrame, (err, assets) => {
            if (err) {
                console.error('❌ Failed to loadDir ui/头像:', err);
                return;
            }
            console.log(`✅ Loaded ${assets.length} TouXiang sprites`);
            assets.forEach((sf: SpriteFrame) => {
                const name = sf.name || '';
                const match = name.match(/(\d+)/);
                if (match) {
                    const num = parseInt(match[1]);
                    if (num >= 1 && num <= 9) {
                        this.cachedTouXiang[num] = sf;
                        console.log(`✅ Cached TouXiang[${num}] from file: ${name}`);
                    }
                } else {
                    console.log(`⚠️ TouXiang file without number: ${name}`);
                }
            });
        });
    }

    preloadAllNames() {
        resources.loadDir('ui/喜好', SpriteFrame, (err, assets) => {
            if (err) {
                console.error('❌ Failed to loadDir ui/喜好:', err);
                return;
            }
            console.log(`✅ Loaded ${assets.length} Name sprites`);
            assets.forEach((sf: SpriteFrame) => {
                const name = sf.name || '';
                const match = name.match(/^(\d+)$/);
                if (match) {
                    const num = parseInt(match[1]);
                    if (num >= 1 && num <= 9) {
                        this.cachedName[`name_${num}`] = sf;
                        console.log(`✅ Cached Name[${num}] from file: ${name}`);
                    }
                }
            });
        });
    }

    getNextBodyIndex(): number {
        if (this.bodySequenceIndex > 9) {
            return 9;
        }
        const index = this.bodySequenceIndex;
        this.bodySequenceIndex++;
        console.log(`Next body index: ${index}`);
        return index;
    }

    async createBody(index: number, inheritPosition: Vec3 = null) {
        if (!this.body) {
            console.error('Body node not found!');
            return;
        }

        const isFirstCreate = !this.currentBody && !inheritPosition && index === 1;

        let newPosition: Vec3 | null = null;
        if (inheritPosition) {
            newPosition = inheritPosition;
        } else if (this.currentBody) {
            newPosition = this.currentBody.getPosition().clone();
        }

        while (this.body.children.length > 0) {
            const child = this.body.children[0];
            child.destroy();
            this.body.removeChild(child);
        }
        this.currentBody = null;

        const prefab = await this.getBodyPrefabAsync(index);
        if (prefab) {
            this.currentBody = instantiate(prefab);
            this.currentBody.name = `body${index}`;
            this.body.addChild(this.currentBody);
            
            if (!isFirstCreate && newPosition) {
                this.currentBody.setPosition(newPosition);
                console.log(`body${index} created at position: ${newPosition}`);
            } else {
                console.log(`body${index} created at prefab default position`);
            }
            
            this.currentBodyIndex = index;
            this.lastBodyPosition.set(this.currentBody.getPosition());
            
            const skeleton = this.currentBody.getComponent(sp.Skeleton);
            if (skeleton) {
                skeleton.setAnimation(0, 'animation', true);
                console.log(`body${index} playing idle animation`);
            }
        } else {
            console.error(`body${index} prefab not found!`);
        }
    }

    recordPositions() {
        if (!this.bg) {
            console.error('BG node not found!');
            return;
        }

        const bgChildren = this.bg.children;
        for (let i = 0; i < Math.min(3, bgChildren.length); i++) {
            const child = bgChildren[i];
            this.bgChildrenPositions.set(child.name, child.getPosition().clone());
            console.log(`Recorded position of ${child.name}: ${child.getPosition()}`);
        }

        if (this.currentBody) {
            this.bodyPosition = this.currentBody.getPosition().clone();
            console.log(`Recorded body position: ${this.bodyPosition}`);
        }

        if (this.qiang) {
            this.qiangPosition = this.qiang.getPosition().clone();
            console.log(`Recorded qiang position: ${this.qiangPosition}`);
        }

        if (this.dimian) {
            this.dimianPosition = this.dimian.getPosition().clone();
            console.log(`Recorded dimian position: ${this.dimianPosition}`);
        }

        if (this.yinzi) {
            this.yinziPosition = this.yinzi.getPosition().clone();
            console.log(`Recorded yinzi position: ${this.yinziPosition}`);
        }
    }

    setupEvents() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);

        if (this.hand) {
            const handButton = this.hand.getComponent(Button);
            if (handButton) {
                handButton.node.on(Button.EventType.CLICK, this.onHandClick, this);
            }
        }

        if (this.okButton) {
            const okButton = this.okButton.getComponent(Button);
            if (okButton) {
                okButton.node.on(Button.EventType.CLICK, this.onOKClick, this);
            }
        }

        if (this.noButton) {
            const noButton = this.noButton.getComponent(Button);
            if (noButton) {
                noButton.node.on(Button.EventType.CLICK, this.onNoClick, this);
            }
        }
    }

    onTouchStart(event: EventTouch) {
        console.log('Touch started');
    }

    onTouchMove(event: EventTouch) {
        const delta = event.getDeltaY();
        if (Math.abs(delta) > 10 && !this.isMoving) {
            this.incrementSwipeCount();
            this.startMoveUp();
        }
    }

    onTouchEnd(event: EventTouch) {
        console.log('Touch ended');
    }

    onHandClick() {
        console.log('Hand clicked');
        if (this.isMoving) {
            this.incrementSwipeCount();
        } else if (this.bodySequenceIndex > 9) {
            this.openBaidu();
        } else {
            this.swipeCount = 1;
            this.startMoveUp();
        }
    }

    onOKClick() {
        console.log('OK clicked');
        if (this.isMoving) {
            this.incrementSwipeCount();
        } else if (this.bodySequenceIndex > 9) {
            this.openBaidu();
        } else {
            this.swipeCount = 1;
            this.startMoveUp();
        }
    }

    openBaidu() {
        console.log('Opening Baidu...');
        if (!this.hasOpenedUrl) {
            this.hasOpenedUrl = true;
            window.open('https://www.baidu.com', '_blank');
        }
    }

    incrementSwipeCount() {
        this.swipeCount++;
        console.log(`Swipe count incremented to: ${this.swipeCount}`);
    }

    startMoveUp() {
        if (this.isMoving) return;
        
        if (this.bodySequenceIndex > this.maxSwipeCount) {
            console.log('Already at last body, opening Baidu');
            if (!this.hasOpenedUrl) {
                this.hasOpenedUrl = true;
                window.open('https://www.baidu.com', '_blank');
            }
            return;
        }
        
        if (this.isFirstOperation) {
            this.isFirstOperation = false;
            console.log('First operation');
        }
        
        this.isMoving = true;
        this.movePhase = 1;
        this.moveSpeed = 0;
        this.moveDistance = 0;
        this.totalMoveDistance = this.bgHeight * 2;
        this.fastLoopCount = 0;
        this.fastLoopTotal = Math.max(0, this.swipeCount - 1);
        this.fastLoopPhase = false;
        this.fastLoopDistance = 0;
        
        this.hideAllDhkImages();
        this.hideTouXiangAndName();
        
        if (this.hand) {
            this.stopHandFloat();
            this.hand.active = true;
        }
        if (this.xiangshang) {
            this.xiangshang.active = true;
        }
        
        this.playFlyAnimation();
        
        console.log(`Start moving up. Swipe count: ${this.swipeCount}, Fast loops: ${this.fastLoopTotal}`);
    }

    hideTouXiangAndName() {
        if (this.touXiang) this.touXiang.active = false;
        if (this.nameNode) this.nameNode.active = false;
        console.log('TouXiang and Name hidden');
    }

    showTouXiangAndName() {
        if (this.touXiang) this.touXiang.active = true;
        if (this.nameNode) this.nameNode.active = true;
        console.log('TouXiang and Name shown');
    }

    updateTouXiang(bodyIndex: number) {
        console.log(`[DEBUG] updateTouXiang called with index: ${bodyIndex}`);
        
        if (!this.touXiang) {
            console.warn(`[DEBUG] touXiang node is null!`);
            return;
        }

        const sprite = this.touXiang.getComponent(Sprite);
        if (!sprite) {
            console.warn(`[DEBUG] Sprite component not found on touXiang!`);
            return;
        }

        const idx = Math.min(Math.max(bodyIndex, 1), 9);

        if (this.cachedTouXiang[idx]) {
            sprite.spriteFrame = this.cachedTouXiang[idx];
            console.log(`✅ TouXiang updated from cache, index ${idx}`);
            return;
        }

        console.log(`⏳ TouXiang ${idx} not in cache yet, retrying...`);
        
        let retryCount = 0;
        const maxRetry = 20;
        const checkInterval = setInterval(() => {
            retryCount++;
            if (this.cachedTouXiang[idx]) {
                clearInterval(checkInterval);
                const currentSprite = this.touXiang?.getComponent(Sprite);
                if (currentSprite && currentSprite.isValid) {
                    currentSprite.spriteFrame = this.cachedTouXiang[idx];
                    console.log(`✅ TouXiang ${idx} applied after ${retryCount} retries`);
                }
            } else if (retryCount >= maxRetry) {
                clearInterval(checkInterval);
                console.error(`❌ TouXiang ${idx} failed to load after ${maxRetry} retries`);
            }
        }, 100);
    }

    updateNameByIndex(nameIndex: number) {
        console.log(`[DEBUG] updateNameByIndex called with index: ${nameIndex}`);
        
        if (!this.nameNode) {
            console.warn(`[DEBUG] nameNode is null!`);
            return;
        }

        const idx = Math.min(Math.max(nameIndex, 1), 9);
        this.currentNameIndex = idx;

        const sprite = this.nameNode.getComponent(Sprite);
        if (!sprite) {
            console.warn(`[DEBUG] Sprite component not found on nameNode!`);
            return;
        }

        const cacheKey = `name_${idx}`;
        if (this.cachedName[cacheKey]) {
            sprite.spriteFrame = this.cachedName[cacheKey];
            console.log(`✅ Name updated from cache, index ${idx}`);
            return;
        }

        console.log(`⏳ Name ${idx} not in cache yet, retrying...`);
        
        let retryCount = 0;
        const maxRetry = 20;
        const checkInterval = setInterval(() => {
            retryCount++;
            if (this.cachedName[cacheKey]) {
                clearInterval(checkInterval);
                const currentSprite = this.nameNode?.getComponent(Sprite);
                if (currentSprite && currentSprite.isValid) {
                    currentSprite.spriteFrame = this.cachedName[cacheKey];
                    console.log(`✅ Name ${idx} applied after ${retryCount} retries`);
                }
            } else if (retryCount >= maxRetry) {
                clearInterval(checkInterval);
                console.error(`❌ Name ${idx} failed to load after ${maxRetry} retries`);
            }
        }, 100);
    }

    updateNameRandom() {
        let randomIndex: number;
        do {
            randomIndex = Math.floor(Math.random() * 9) + 1;
        } while (randomIndex === this.currentNameIndex);

        this.updateNameByIndex(randomIndex);
    }

    playFlyAnimation() {
        if (!this.girl) {
            console.log('No girl node found');
            return;
        }
        
        const skeleton = this.girl.getComponent(sp.Skeleton);
        if (!skeleton) {
            console.log('No skeleton component found on girl');
            return;
        }
        
        console.log('Found skeleton on girl node');
        
        skeleton.setCompleteListener(() => {
            console.log('Fly complete, switching to idle');
            skeleton.setCompleteListener(null);
            skeleton.setAnimation(0, 'idle', true);
        });
        
        const success = skeleton.setAnimation(0, 'fly', false);
        console.log('Set fly animation result:', success);
    }

    playGirlFlyOnce() {
        if (!this.girl) return;
        
        if (this.jianbian) {
            this.jianbian.active = false;
            console.log('Jianbian hidden when girl starts moving');
        }
        
        const skeleton = this.girl.getComponent(sp.Skeleton);
        if (!skeleton) return;
        
        const currentAnim = skeleton.getCurrent(0);
        if (currentAnim && currentAnim.animation.name === 'fly') return;
        
        skeleton.setCompleteListener(() => {
            skeleton.setCompleteListener(null);
            skeleton.setAnimation(0, 'idle', true);
        });
        
        skeleton.setAnimation(0, 'fly', false);
        console.log(`Girl fly animation played for loop ${this.fastLoopCount}`);
    }

    update(deltaTime: number) {
        if (!this.isMoving) return;

        if (this.fastLoopPhase) {
            this.updateFastLoop(deltaTime);
            return;
        }

        if (this.movePhase === 1) {
            this.moveSpeed += this.acceleration * deltaTime;
            if (this.moveSpeed >= this.maxSpeed) {
                this.moveSpeed = this.maxSpeed;
            }
            
            if (this.moveDistance >= this.bgHeight) {
                this.movePhase = 2;
                this.onReachTop();
            }
        } else if (this.movePhase === 2) {
            this.moveSpeed -= this.deceleration * deltaTime;
            if (this.moveSpeed <= 100) {
                this.moveSpeed = 100;
            }
            
            if (this.moveDistance >= this.totalMoveDistance) {
                this.isMoving = false;
                this.movePhase = 0;
                this.moveSpeed = 0;
                this.playBounceEffect();
                return;
            }
        }

        const moveStep = this.moveSpeed * deltaTime;
        this.moveDistance += moveStep;
        
        this.moveNodesUp(moveStep);
    }

    async updateFastLoop(deltaTime: number) {
        const moveStep = this.fastSpeed * deltaTime;
        
        this.moveNodesUp(moveStep);
        
        if (this.currentBody) {
            const currentY = this.currentBody.getPosition().y;
            const topPosition = this.bodyPosition.y + this.bgHeight;
            
            if (currentY >= topPosition) {
                this.fastLoopCount++;
                
                this.playGirlFlyOnce();
                
                const nextIndex = this.getNextBodyIndex();
                
                if (nextIndex > 9 || this.bodySequenceIndex > 9) {
                    console.log('Body index exceeded max, showing last body and opening Baidu');
                    this.isMoving = false;
                    this.fastLoopPhase = false;
                    
                    await this.createBody(9, this.bodyPosition);
                    
                    if (this.qiang) this.qiang.setPosition(this.qiangPosition);
                    if (this.dimian) this.dimian.setPosition(this.dimianPosition);
                    if (this.yinzi) this.yinzi.setPosition(this.yinziPosition);
                    
                    if (!this.hasOpenedUrl) {
                        this.hasOpenedUrl = true;
                       // this.urlOpenCooldown = this.urlCooldownDuration;
                        window.open('https://www.baidu.com', '_blank');
                    }
                    return;
                }
                
                if (this.fastLoopCount >= this.fastLoopTotal) {
                    this.fastLoopPhase = false;
                    this.movePhase = 2;
                    this.moveDistance = this.bgHeight;
                    
                    const belowPosition = new Vec3(
                        this.bodyPosition.x,
                        this.bodyPosition.y - this.bgHeight,
                        this.bodyPosition.z
                    );
                    await this.createBody(nextIndex, belowPosition);
                    console.log(`Final body${nextIndex} created, slowing down...`);
                    
                    this.resetNodesToBelow();
                } else {
                    const belowPosition = new Vec3(
                        this.bodyPosition.x,
                        this.bodyPosition.y - this.bgHeight,
                        this.bodyPosition.z
                    );
                    await this.createBody(nextIndex, belowPosition);
                    console.log(`Fast loop ${this.fastLoopCount}/${this.fastLoopTotal}, body${nextIndex}`);
                    
                    this.resetNodesToBelow();
                }
            }
        }
    }

    resetNodesToBelow() {
        if (this.qiang) {
            this.qiang.setPosition(this.qiangPosition.x, this.qiangPosition.y - this.bgHeight, this.qiangPosition.z);
        }
        if (this.dimian) {
            this.dimian.setPosition(this.dimianPosition.x, this.dimianPosition.y - this.bgHeight, this.dimianPosition.z);
        }
        if (this.yinzi) {
            this.yinzi.setPosition(this.yinziPosition.x, this.yinziPosition.y - this.bgHeight, this.yinziPosition.z);
        }
    }

    moveNodesUp(distance: number) {
        if (this.qiang) {
            const pos = this.qiang.getPosition();
            this.qiang.setPosition(pos.x, pos.y + distance, pos.z);
        }

        if (this.dimian) {
            const pos = this.dimian.getPosition();
            this.dimian.setPosition(pos.x, pos.y + distance, pos.z);
        }

        if (this.yinzi) {
            const pos = this.yinzi.getPosition();
            this.yinzi.setPosition(pos.x, pos.y + distance, pos.z);
        }

        if (this.currentBody) {
            const pos = this.currentBody.getPosition();
            this.currentBody.setPosition(pos.x, pos.y + distance, pos.z);
        }

        if (this.hand && this.hand.active && this.end) {
            const currentY = this.hand.getPosition().y;
            const endY = this.end.getPosition().y;
            
            if (currentY >= endY) {
                this.hand.active = false;
                if (this.xiangshang) this.xiangshang.active = false;
                console.log('Hand and xiangshang hidden at end position');
            } else {
                const pos = this.hand.getPosition();
                this.hand.setPosition(pos.x, pos.y + distance, pos.z);
            }
        }
    }

    playBounceEffect() {
        console.log(`[DEBUG] playBounceEffect called, currentBodyIndex: ${this.currentBodyIndex}`);
        
        this.stopHandFloat();
        
        this.swipeCount = 0;
        this.fastLoopTotal = 0;
        
        console.log(`[DEBUG] About to update TouXiang with index: ${this.currentBodyIndex}`);
        this.updateTouXiang(this.currentBodyIndex);
        console.log(`[DEBUG] About to update Name with index: ${this.currentBodyIndex}`);
        this.updateNameByIndex(this.currentBodyIndex);
        this.showTouXiangAndName();
        
        const bounceUp = this.bounceDistance;
        const bounceDown = this.bounceDistance * 0.3;
        
        const nodes = [this.qiang, this.dimian, this.yinzi, this.currentBody].filter(n => n);
        const positions = [this.qiangPosition, this.dimianPosition, this.yinziPosition, this.bodyPosition];
        
        nodes.forEach((node, index) => {
            if (!node) return;
            const targetPos = positions[index];
            
            tween(node)
                .to(this.bounceDuration / 2, { position: new Vec3(targetPos.x, targetPos.y + bounceUp, targetPos.z) }, { easing: 'sineOut' })
                .to(this.bounceDuration / 3, { position: new Vec3(targetPos.x, targetPos.y - bounceDown, targetPos.z) }, { easing: 'sineInOut' })
                .to(this.bounceDuration / 6, { position: targetPos }, { easing: 'sineOut' })
                .call(() => {
                    if (index === nodes.length - 1) {
                        this.resetHandToOk();
                    }
                })
                .start();
        });
    }

    resetHandToOk() {
        if (this.hand && this.okButton) {
            const okPos = this.okButton.getPosition();
            const targetPos = new Vec3(okPos.x + 80, okPos.y - 60, okPos.z);
            
            this.showRandomDhkImage();
            this.hand.setPosition(targetPos);
            console.log('Hand reset to ok button position');
        }
        
        this.hideHandAndXiangshang();
        
        if (this.currentBodyIndex >= 9 || this.bodySequenceIndex > 9) {
            console.log('At last body, will not show hand again');
            return;
        }
        
        this.scheduleOnce(() => {
            if (this.isMoving) return;
            if (this.currentBodyIndex >= 9 || this.bodySequenceIndex > 9) return;
            this.showHandAndXiangshang();
        }, 4);
    }

    showRandomDhkImage() {
        if (!this.dhk) return;
        
        const children = this.dhk.children;
        if (children.length === 0) return;
        
        children.forEach(child => {
            child.active = false;
        });
        
        const randomIndex = Math.floor(Math.random() * children.length);
        children[randomIndex].active = true;
        
        console.log(`Showing random dhk image: ${children[randomIndex].name}`);
        
        this.scheduleOnce(() => {
            children[randomIndex].active = false;
            console.log('Dhk image hidden after 2 seconds');
        }, 2);
    }

    async onReachTop() {
        console.log(`Reached top. Fast loop total: ${this.fastLoopTotal}`);
        
        if (this.fastLoopTotal <= 0) {
            this.movePhase = 2;
            const belowPosition = new Vec3(
                this.bodyPosition.x,
                this.bodyPosition.y - this.bgHeight,
                this.bodyPosition.z
            );
            await this.createBody(this.getNextBodyIndex(), belowPosition);
            this.resetNodesToBelow();
            console.log('No fast loop, entering deceleration phase');
            return;
        }
        
        this.fastLoopPhase = true;
        this.fastLoopDistance = 0;
        
        const nextIndex = this.getNextBodyIndex();
        const belowPosition = new Vec3(
            this.bodyPosition.x,
            this.bodyPosition.y - this.bgHeight,
            this.bodyPosition.z
        );
        await this.createBody(nextIndex, belowPosition);
        console.log(`Fast loop started with body${nextIndex}`);
        
        this.resetNodesToBelow();
    }

    onMoveComplete() {
        console.log('Move complete, returning to initial positions...');
        
        if (this.qiang) {
            this.qiang.setPosition(this.qiangPosition);
        }

        if (this.dimian) {
            this.dimian.setPosition(this.dimianPosition);
        }

        if (this.yinzi) {
            this.yinzi.setPosition(this.yinziPosition);
        }

        if (this.currentBody) {
            this.currentBody.setPosition(this.bodyPosition);
        }
        
        console.log(`Current body index: ${this.currentBodyIndex}`);
    }

    startHandSwipeGuide() {
        if (!this.hand) return;
        
        let startPos: Vec3;
        let endPos: Vec3;
        
        if (this.frist && this.end) {
            startPos = this.frist.getPosition().clone();
            endPos = this.end.getPosition().clone();
            console.log(`Using frist(${startPos}) to end(${endPos}) for hand guide`);
        } else {
            startPos = this.handOriginalPosition.clone();
            endPos = new Vec3(startPos.x, startPos.y + 80, startPos.z);
            console.warn('frist/end nodes not found, using fallback positions');
        }
        
        this.hand.setPosition(startPos);
        
        this.handFloatTween = tween(this.hand)
            .to(0.8, { position: endPos }, { easing: 'quadOut' })
            .to(0.4, { position: startPos }, { easing: 'quadIn' })
            .call(() => console.log('Hand swipe guide at frist'))
            .union()
            .repeatForever()
            .start();
        
        console.log('Hand swipe guide animation started');
    }

    startHandFloat() {
        if (!this.hand) return;
        
        const basePos = this.hand.getPosition().clone();
        const floatRange = 15;
        const floatDuration = 1.5;
        
        this.stopHandFloat();
        
        this.handFloatTween = tween(this.hand)
            .to(floatDuration, { position: new Vec3(basePos.x + floatRange, basePos.y + floatRange, basePos.z) }, { easing: 'sineInOut' })
            .to(floatDuration, { position: new Vec3(basePos.x - floatRange, basePos.y + floatRange, basePos.z) }, { easing: 'sineInOut' })
            .to(floatDuration, { position: new Vec3(basePos.x - floatRange, basePos.y - floatRange, basePos.z) }, { easing: 'sineInOut' })
            .to(floatDuration, { position: basePos }, { easing: 'sineInOut' })
            .union()
            .repeatForever()
            .start();
        
        console.log('Hand float animation started');
    }

    stopHandFloat() {
        if (this.handFloatTween) {
            this.handFloatTween.stop();
            this.handFloatTween = null;
        }
    }

    moveHandToXiangshang() {
        if (!this.hand || !this.xiangshang) return;
        
        const targetPos = this.xiangshang.getPosition().clone();
        targetPos.y += 30;
        
        tween(this.hand)
            .to(0.3, { position: targetPos }, { easing: 'backOut' })
            .start();
        
        console.log('Hand moved to xiangshang position');
    }
}
