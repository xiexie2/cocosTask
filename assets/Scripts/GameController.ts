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
    btnTest: Node = null!;
    
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
    btnIcon: Node = null!;

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
    private xiangshangColorIndex: number = 0;
    private xiangshangSprites: Sprite[] = [];
    private xiangshangFrames: SpriteFrame[] = [];
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
    private isGirlWalking: boolean = false;
    private canSwipe: boolean = true;
    private movePhase: number = 0;
    private moveSpeed: number = 0;
    private maxSpeed: number = 3500;
    private fastSpeed: number = 6500;
    private acceleration: number = 5500;
    private deceleration: number = 2500;
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
    private storeLinkCooldown: boolean = false;
    private isFirstBodyGuided: boolean = false;
    private bodyExtraYOffset: number = 0;
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
        this.startButtonScaleAnim();
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
    }

    onScreenResize() {
        view.setDesignResolutionSize(this.designWidth, this.designHeight, ResolutionPolicy.SHOW_ALL);
        this.applyPortraitViewport();
        this.updateOrientation();
    }

    updateOrientation() {
        const visibleSize = view.getVisibleSize();
        this.isLandscape = visibleSize.width > visibleSize.height;
    }

    private applyPortraitViewport = () => {
        view.setDesignResolutionSize(this.designWidth, this.designHeight, ResolutionPolicy.SHOW_ALL);

        if (typeof window === 'undefined' || typeof document === 'undefined') return;

        const canvas = document.getElementById('GameCanvas') as HTMLCanvasElement | null;
        if (!canvas) return;

        const topOffset = Math.max(0, canvas.getBoundingClientRect().top);
        const availableWidth = window.innerWidth;
        const availableHeight = Math.max(1, window.innerHeight - topOffset);
        const width = Math.floor(availableWidth);
        const height = Math.floor(availableHeight);
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
        resources.load('mp3/bgyy', AudioClip, (err, clip) => {
            if (err) {
                resources.load('mp3/bgyy/mp3', AudioClip, (err2, clip2) => {
                    if (!err2 && clip2) this.initAndPlayBGM(clip2);
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
        if (this.xiangshang) {
            this.xiangshang.active = true;
            this.initXiangshangColor();
            this.schedule(() => this.xiangshangColorCycle(), 0.6);
        }
        
        if (this.big) this.big.active = false;
        if (this.heimu) this.heimu.active = false;
        
        this.resetIdleTimer();
    }

    resetIdleTimer() {
        this.idleTimer = 0;
    }

    startButtonScaleAnim() {
        const duration = 0.6;
        if (this.okButton) {
            tween(this.okButton)
                .to(duration, { scale: new Vec3(1.1, 1.1, 1) }, { easing: 'sineInOut' })
                .to(duration, { scale: new Vec3(0.9, 0.9, 1) }, { easing: 'sineInOut' })
                .union()
                .repeatForever()
                .start();
        }
        if (this.noButton) {
            tween(this.noButton)
                .to(duration, { scale: new Vec3(1.1, 1.1, 1) }, { easing: 'sineInOut' })
                .to(duration, { scale: new Vec3(0.9, 0.9, 1) }, { easing: 'sineInOut' })
                .union()
                .repeatForever()
                .start();
        }
    }

    showHandAndXiangshang() {
        if (!this.isFirstBodyGuided) {
            this.isFirstBodyGuided = true;
        }
        
        if (this.hand) {
            this.hand.active = true;
            this.startHandFloat();
        }
        
        if (this.xiangshang) {
            this.xiangshang.active = true;
            this.unschedule(this.xiangshangColorCycle);
            this.initXiangshangColor();
            this.schedule(() => this.xiangshangColorCycle(), 0.6);
        }
    }

    showHandAfterIdle() {
        if (this.isMoving) return;
        if (this.isGirlWalking) return;
        if (this.currentBodyIndex >= 9 || this.bodySequenceIndex > 9) return;
        this.showHandAndXiangshang();
    }

    hideHandAndXiangshang() {
        if (this.hand) this.hand.active = false;
        if (this.xiangshang) {
            this.xiangshang.active = false;
            this.unschedule(this.xiangshangColorCycle);
        }
    }

    initXiangshangColor() {
        this.xiangshangSprites = [];
        this.xiangshangFrames = [];
        for (let i = 1; i <= 4; i++) {
            const child = this.xiangshang!.getChildByName(String(i));
            if (child) {
                const sp = child.getComponent(Sprite);
                if (sp && sp.spriteFrame) {
                    this.xiangshangSprites.push(sp);
                    this.xiangshangFrames.push(sp.spriteFrame);
                }
            }
        }
        this.xiangshangColorIndex = 0;
        this.doXiangshangSwap();
    }

    xiangshangColorCycle() {
        this.xiangshangColorIndex = (this.xiangshangColorIndex + 1) % 4;
        this.doXiangshangSwap();
    }

    doXiangshangSwap() {
        const n = this.xiangshangSprites.length;
        for (let i = 0; i < n; i++) {
            const srcIdx = (i + this.xiangshangColorIndex) % n;
            this.xiangshangSprites[i].spriteFrame = this.xiangshangFrames[srcIdx];
        }
    }

    hideAllDhkImages() {
        if (!this.dhk) return;
        this.dhk.children.forEach(child => { child.active = false; });
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
                    resolve(prefab);
                } else {
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
            if (err) return;
            assets.forEach((sf: SpriteFrame) => {
                const name = sf.name || '';
                const match = name.match(/(\d+)/);
                if (match) {
                    const num = parseInt(match[1]);
                    if (num >= 1 && num <= 9) this.cachedTouXiang[num] = sf;
                }
            });
        });
    }

    preloadAllNames() {
        resources.loadDir('ui/喜好', SpriteFrame, (err, assets) => {
            if (err) return;
            assets.forEach((sf: SpriteFrame) => {
                const name = sf.name || '';
                const match = name.match(/^(\d+)$/);
                if (match) {
                    const num = parseInt(match[1]);
                    if (num >= 1 && num <= 9) this.cachedName[`name_${num}`] = sf;
                }
            });
        });
    }

    getNextBodyIndex(): number {
        if (this.bodySequenceIndex > 9) return 9;
        const index = this.bodySequenceIndex;
        this.bodySequenceIndex++;
        return index;
    }

    async createBody(index: number, inheritPosition: Vec3 = null) {
        if (!this.body) return;

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
                this.bodyExtraYOffset = (index === 5 || index === 6 || index === 7) ? 31.2 : 0;
                if (this.bodyExtraYOffset > 0) {
                    const pos = this.currentBody.getPosition();
                    this.currentBody.setPosition(pos.x, pos.y + this.bodyExtraYOffset, pos.z);
                }
            } else {
                this.bodyExtraYOffset = 0;
            }
            
            this.currentBodyIndex = index;
            this.lastBodyPosition.set(this.currentBody.getPosition());
            
            const skeleton = this.currentBody.getComponent(sp.Skeleton);
            if (skeleton) skeleton.setAnimation(0, 'animation', true);
        }
    }

    recordPositions() {
        if (!this.bg) return;

        const bgChildren = this.bg.children;
        for (let i = 0; i < Math.min(3, bgChildren.length); i++) {
            const child = bgChildren[i];
            this.bgChildrenPositions.set(child.name, child.getPosition().clone());
        }

        if (this.currentBody) this.bodyPosition = this.currentBody.getPosition().clone();
        if (this.qiang) this.qiangPosition = this.qiang.getPosition().clone();
        if (this.dimian) this.dimianPosition = this.dimian.getPosition().clone();
        if (this.yinzi) this.yinziPosition = this.yinzi.getPosition().clone();
    }

    setupEvents() {
        if (this.mainUI) {
            this.mainUI.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
            this.mainUI.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
            this.mainUI.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        } else {
            this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
            this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
            this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        }

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

        if (this.btnTest) {
            const testButton = this.btnTest.getComponent(Button);
            if (testButton) {
                testButton.node.on(Button.EventType.CLICK, this.onBtnTestClick, this);
            }
        }

        if (this.btnIcon) {
            const btnIconButton = this.btnIcon.getComponent(Button);
            if (btnIconButton) {
                btnIconButton.node.on(Button.EventType.CLICK, this.onBtnIconClick, this);
            }
        }

        if (this.heimu) {
            const heimuButton = this.heimu.getComponent(Button);
            if (heimuButton) {
                heimuButton.node.on(Button.EventType.CLICK, this.onHeimuClick, this);
            }
        }

        if (this.big) {
            const bigButton = this.big.getComponent(Button);
            if (bigButton) {
                bigButton.node.on(Button.EventType.CLICK, this.onBigClick, this);
            }
        }
    }

    private touchStartY: number = 0;

    onTouchStart(event: EventTouch) {
        this.touchStartY = event.getUILocation().y;
    }

    onTouchMove(event: EventTouch) {
        if (!this.canSwipe) return;
        
        const currentY = event.getUILocation().y;
        const totalDelta = Math.abs(this.touchStartY - currentY);

        if (totalDelta > 50 && !this.isMoving) {
            this.incrementSwipeCount();
            this.startMoveUp();
        }
    }

    onTouchEnd(event: EventTouch) {}

    onHandClick() {
        if (this.isMoving) {
            this.incrementSwipeCount();
        } else if (this.bodySequenceIndex > 9) {
            this.openStoreLink();
        } else {
            this.swipeCount = 1;
            this.startMoveUp();
        }
    }

    onOKClick() {
        if (this.isMoving) return;
        if (this.bodySequenceIndex > 9) {
            this.openBaidu();
        } else {
            this.swipeCount = 1;
            this.startMoveUp();
        }
    }

    openBaidu() {
        this.openStoreLink();
    }

    onNoClick() {
        if (this.isMoving) return;
        this.startGirlWalkSequence();
    }

    startGirlWalkSequence() {
        if (this.isGirlWalking) return;
        this.isGirlWalking = true;
        
        this.hideUIForGirlWalk();
        this.disableSwipe();
        this.moveGirlToFront();
    }

    hideUIForGirlWalk() {
        
        if (this.okButton) this.okButton.active = false;
        if (this.noButton) this.noButton.active = false;
        if (this.hand) this.hand.active = false;
        if (this.xiangshang) this.xiangshang.active = false;
        if (this.dianti) this.dianti.active = false;
        if (this.jianbian) this.jianbian.active = false;
        if (this.zjhx) this.zjhx.active = false;
        if (this.btnIcon) this.btnIcon.active = false;
        
        this.stopHandFloat();
        this.unschedule(this.showHandAndXiangshang);
    }

    disableSwipe() {
        this.canSwipe = false;
    }

    moveGirlToFront() {
        if (!this.girl || !this.yz) return;
        
        const skeleton = this.girl.getComponent(sp.Skeleton);
        if (!skeleton) return;
        
        const targetX = this.currentBody ? this.currentBody.getPosition().x - 100 : -200;
        const startPos = this.girl.getPosition();
        const yzStartPos = this.yz.getPosition();
        
        const duration = 4.5;
        let elapsedTime = 0;
        
        const walkAnim = () => {
            elapsedTime += 0.016;
            const progress = Math.min(elapsedTime / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            const currentX = startPos.x + (targetX - startPos.x) * easeProgress;
            this.girl.setPosition(currentX, startPos.y, startPos.z);
            
            if (this.yz) {
                const yzCurrentX = yzStartPos.x + (targetX - yzStartPos.x) * easeProgress;
                this.yz.setPosition(yzCurrentX, yzStartPos.y, yzStartPos.z);
            }
            
            if (progress < 1) {
                requestAnimationFrame(walkAnim);
            } else {
                this.onGirlReachedFront();
            }
        };
        
        skeleton.setAnimation(0, 'walk', true);
        requestAnimationFrame(walkAnim);
    }

    onGirlReachedFront() {
        if (this.girl) {
            const skeleton = this.girl.getComponent(sp.Skeleton);
            if (skeleton) {
                skeleton.setAnimation(0, 'idle', true);
            }
        }
        
        this.scheduleOnce(() => {
            this.showHeimuAndBig();
        }, 2);
    }

    showHeimuAndBig() {
        if (this.heimu) this.heimu.active = true;
        if (this.big) this.big.active = true;
        
        this.isGirlWalking = false;
    }

    onBtnTestClick() {}

    openStoreLink() {
        if (this.storeLinkCooldown) return;
        
        this.storeLinkCooldown = true;
        this.scheduleOnce(() => {
            this.storeLinkCooldown = false;
        }, 2);

        const platform = this.detectAdPlatform();
        const storeUrl = this.getStoreUrl(platform);
        this.openByPlatform(platform, storeUrl);
    }

    detectAdPlatform(): string {
        const w = window as any;
        if (w.mraid) return 'MRAID';
        if (w.FBAdBridge || w.FAN || w.FacebookAds) return 'FACEBOOK';
        if (w.admob || w.google && w.google.ads) return 'GOOGLE';
        if (w.Tapjoy) return 'TAPJOY';
        if (w.TTAdSDK || w.tiktok_ad) return 'TIKTOK';
        if (w.UnityAds || w.unityads) return 'UNITY';
        return 'UNKNOWN';
    }

    getStoreUrl(platform: string): string {
        const storeUrl = 'https://play.google.com/store/apps/details?id=com.huadongqifei.app';
        return storeUrl;
    }

    openByPlatform(platform: string, url: string) {
        const w = window as any;

        switch (platform) {
            case 'MRAID':
                if (w.mraid && w.mraid.open) {
                    w.mraid.open(url);
                } else {
                    window.open(url, '_blank');
                }
                break;
            case 'FACEBOOK':
                if (w.FBAdBridge && w.FBAdBridge.open) {
                    w.FBAdBridge.open(url);
                } else {
                    window.open(url, '_blank');
                }
                break;
            case 'GOOGLE':
                if (w.admob && w.admob.open) {
                    w.admob.open(url);
                } else {
                    window.open(url, '_blank');
                }
                break;
            case 'TAPJOY':
                if (w.Tapjoy && w.Tapjoy.open) {
                    w.Tapjoy.open(url);
                } else {
                    window.open(url, '_blank');
                }
                break;
            case 'TIKTOK':
                if (w.TTAdSDK && w.TTAdSDK.open) {
                    w.TTAdSDK.open(url);
                } else {
                    window.open(url, '_blank');
                }
                break;
            case 'UNITY':
                if (w.UnityAds && w.UnityAds.open) {
                    w.UnityAds.open(url);
                } else {
                    window.open(url, '_blank');
                }
                break;
            default:
                window.open(url, '_blank');
                break;
        }
    }

    onBtnIconClick() {
        this.openStoreLink();
    }

    onHeimuClick() {
        this.openStoreLink();
    }

    onBigClick() {
        this.openStoreLink();
    }

    incrementSwipeCount() {
        this.swipeCount++;
    }

    startMoveUp() {
        if (this.isMoving) return;
        
        this.unschedule(this.showHandAfterIdle);
        
        if (this.bodySequenceIndex > this.maxSwipeCount) {
            this.openStoreLink();
            return;
        }
        
        if (this.isFirstOperation) {
            this.isFirstOperation = false;
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
    }

    hideTouXiangAndName() {
        if (this.touXiang) this.touXiang.active = false;
        if (this.nameNode) this.nameNode.active = false;
    }

    showTouXiangAndName() {
        if (this.touXiang) this.touXiang.active = true;
        if (this.nameNode) this.nameNode.active = true;
    }

    updateTouXiang(bodyIndex: number) {
        if (!this.touXiang) return;

        const sprite = this.touXiang.getComponent(Sprite);
        if (!sprite) return;

        const idx = Math.min(Math.max(bodyIndex, 1), 9);

        if (this.cachedTouXiang[idx]) {
            sprite.spriteFrame = this.cachedTouXiang[idx];
            return;
        }
        
        let retryCount = 0;
        const maxRetry = 20;
        const checkInterval = setInterval(() => {
            retryCount++;
            if (this.cachedTouXiang[idx]) {
                clearInterval(checkInterval);
                const currentSprite = this.touXiang?.getComponent(Sprite);
                if (currentSprite && currentSprite.isValid) {
                    currentSprite.spriteFrame = this.cachedTouXiang[idx];
                }
            } else if (retryCount >= maxRetry) {
                clearInterval(checkInterval);
            }
        }, 100);
    }

    updateNameByIndex(nameIndex: number) {
        if (!this.nameNode) return;

        const idx = Math.min(Math.max(nameIndex, 1), 9);
        this.currentNameIndex = idx;

        const sprite = this.nameNode.getComponent(Sprite);
        if (!sprite) return;

        const cacheKey = `name_${idx}`;
        if (this.cachedName[cacheKey]) {
            sprite.spriteFrame = this.cachedName[cacheKey];
            return;
        }
        
        let retryCount = 0;
        const maxRetry = 20;
        const checkInterval = setInterval(() => {
            retryCount++;
            if (this.cachedName[cacheKey]) {
                clearInterval(checkInterval);
                const currentSprite = this.nameNode?.getComponent(Sprite);
                if (currentSprite && currentSprite.isValid) {
                    currentSprite.spriteFrame = this.cachedName[cacheKey];
                }
            } else if (retryCount >= maxRetry) {
                clearInterval(checkInterval);
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
        if (!this.girl) return;
        
        const skeleton = this.girl.getComponent(sp.Skeleton);
        if (!skeleton) return;
        
        skeleton.setCompleteListener(() => {
            skeleton.setCompleteListener(null);
            skeleton.timeScale = 1;
            skeleton.setAnimation(0, 'idle', true);
        });
        
        skeleton.timeScale = 0.9;
        skeleton.setAnimation(0, 'fly', false);
    }

    playGirlFlyOnce() {
        if (!this.girl) return;
        
        if (this.jianbian) {
            this.jianbian.active = false;
        }
        
        this.stopHandFloat();
        this.hideHandAndXiangshang();
        this.unschedule(this.showHandAndXiangshang);
        
        const skeleton = this.girl.getComponent(sp.Skeleton);
        if (!skeleton) return;
        
        const currentAnim = skeleton.getCurrent(0);
        if (currentAnim && currentAnim.animation.name === 'fly') return;
        
        skeleton.setCompleteListener(() => {
            skeleton.setCompleteListener(null);
            skeleton.timeScale = 1;
            skeleton.setAnimation(0, 'idle', true);
        });
        
        skeleton.timeScale = 0.9;
        skeleton.setAnimation(0, 'fly', false);
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
                
                if (this.currentBodyIndex >= 9 || this.bodySequenceIndex > 9) {
                    this.playBounceEffect();
                    return;
                }
                
                this.playBounceEffect();
                
                this.scheduleOnce(this.showHandAfterIdle, 4);
                
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
                    this.isMoving = false;
                    this.fastLoopPhase = false;
                    
                    await this.createBody(9, this.bodyPosition);
                    
                    if (this.qiang) this.qiang.setPosition(this.qiangPosition);
                    if (this.dimian) this.dimian.setPosition(this.dimianPosition);
                    if (this.yinzi) this.yinzi.setPosition(this.yinziPosition);
                    
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
                    
                    this.resetNodesToBelow();
                } else {
                    const belowPosition = new Vec3(
                        this.bodyPosition.x,
                        this.bodyPosition.y - this.bgHeight,
                        this.bodyPosition.z
                    );
                    await this.createBody(nextIndex, belowPosition);
                    
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
            } else {
                const pos = this.hand.getPosition();
                this.hand.setPosition(pos.x, pos.y + distance, pos.z);
            }
        }
    }

    playBounceEffect() {
        this.stopHandFloat();
        
        this.swipeCount = 0;
        this.fastLoopTotal = 0;
        
        this.updateTouXiang(this.currentBodyIndex);
        this.updateNameByIndex(this.currentBodyIndex);
        this.showTouXiangAndName();
        
        const bounceUp = this.bounceDistance;
        const bounceDown = this.bounceDistance * 0.3;
        
        const nodes = [this.qiang, this.dimian, this.yinzi, this.currentBody].filter(n => n);
        const positions = [this.qiangPosition, this.dimianPosition, this.yinziPosition, 
            this.currentBody ? new Vec3(this.bodyPosition.x, this.bodyPosition.y + this.bodyExtraYOffset, this.bodyPosition.z) : this.bodyPosition];
        
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

            this.hand.setPosition(targetPos);
        }

        this.hideHandAndXiangshang();
    }

    showRandomDhkImage() {
        if (!this.dhk) return;
        
        const children = this.dhk.children;
        if (children.length === 0) return;
        
        children.forEach(child => { child.active = false; });
        
        const randomIndex = Math.floor(Math.random() * children.length);
        children[randomIndex].active = true;
        
        this.scheduleOnce(() => {
            children[randomIndex].active = false;
        }, 2);
    }

    async onReachTop() {
        if (this.fastLoopTotal <= 0) {
            this.movePhase = 2;
            const belowPosition = new Vec3(
                this.bodyPosition.x,
                this.bodyPosition.y - this.bgHeight,
                this.bodyPosition.z
            );
            await this.createBody(this.getNextBodyIndex(), belowPosition);
            this.resetNodesToBelow();
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
        
        this.resetNodesToBelow();
    }

    onMoveComplete() {
        if (this.qiang) this.qiang.setPosition(this.qiangPosition);
        if (this.dimian) this.dimian.setPosition(this.dimianPosition);
        if (this.yinzi) this.yinzi.setPosition(this.yinziPosition);
        if (this.currentBody) {
            this.currentBody.setPosition(this.bodyPosition.x, this.bodyPosition.y + this.bodyExtraYOffset, this.bodyPosition.z);
        }
    }

    startHandSwipeGuide() {
        if (!this.hand) return;
        
        let startPos: Vec3;
        let endPos: Vec3;
        
        if (this.frist && this.end) {
            startPos = this.frist.getPosition().clone();
            endPos = this.end.getPosition().clone();
        } else {
            startPos = this.handOriginalPosition.clone();
            endPos = new Vec3(startPos.x, startPos.y + 80, startPos.z);
        }
        
        this.hand.setPosition(startPos);
        
        this.handFloatTween = tween(this.hand)
            .to(0.8, { position: endPos }, { easing: 'quadOut' })
            .to(0.4, { position: startPos }, { easing: 'quadIn' })
            .union()
            .repeatForever()
            .start();
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
    }
}
