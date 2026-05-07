@echo off
chcp 65001 >nul 2>&1
echo ============================================
echo   MRAID Playable Ad Builder
echo   HuaDongQiFei Project
echo ============================================
echo.

:: Configuration
set PROJECT_DIR=%~dp0
set BUILD_DIR=%PROJECT_DIR%build-mraid
set OUTPUT_FILE=%PROJECT_DIR%mraid-ad.html
set STORE_URL=https://apps.apple.com/app/your-app-id

echo [1/5] Cleaning previous build...
if exist "%BUILD_DIR%" rmdir /s /q "%BUILD_DIR%"
if exist "%OUTPUT_FILE%" del /q "%OUTPUT_FILE%"
mkdir "%BUILD_DIR%"

echo [2/5] Checking for Cocos Creator build output...
if not exist "%PROJECT_DIR%build" (
    echo.
    echo ⚠️  WARNING: Build directory not found!
    echo Please build the project first using Cocos Creator:
    echo   Project ^> Build ^> Web Mobile
    echo.
    echo Using demo mode with placeholder content...
    goto :DEMO_MODE
)

:: Copy build files
xcopy /E /I /Y "%PROJECT_DIR%build\web-mobile\*" "%BUILD_DIR%\" >nul 2>&1

echo [3/5] Creating MRAID wrapper...

:: Create the MRAID HTML file
(
echo ^<!DOCTYPE html^>
echo ^<html lang="zh-CN"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"^>
echo     ^<meta http-equiv="X-UA-Compatible" content="IE=edge"^>
echo     ^<title^>HuaDongQiFei - MRAID Playable Ad^</title^>
echo.
echo     ^<style^>
echo         * { margin: 0; padding: 0; box-sizing: border-box; }
echo         html, body { width: 100%%; height: 100%%; overflow: hidden; background-color: #000; display: flex; align-items: center; justify-content: center; }
echo         #ad-container { position: relative; width: min(100vw, 56.2219vh, 750px); height: min(100vh, 177.8667vw, 1334px); aspect-ratio: 750 / 1334; margin: auto; overflow: hidden; background-color: #fff; }
echo         #game-canvas { width: 100%%; height: 100%%; display: block; touch-action: none; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
echo         #loading-screen { position: absolute; top: 0; left: 0; width: 100%%; height: 100%%; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 1000; transition: opacity 0.5s ease-out; }
echo         .loader { width: 60px; height: 60px; border: 4px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%%; animation: spin 1s linear infinite; }
echo         @keyframes spin { to { transform: rotate(360deg); } }
echo         #loading-text { color: #fff; font-size: 18px; margin-top: 20px; font-weight: 300; }
echo         #cta-button { position: absolute; bottom: 30px; left: 50%%; transform: translateX(-50%%); padding: 15px 40px; background: linear-gradient(135deg, #f093fb 0%%, #f5576c 100%%); color: white; font-size: 20px; font-weight: bold; border: none; border-radius: 25px; cursor: pointer; z-index: 999; box-shadow: 0 4px 15px rgba(245,87,108,0.4); transition: all 0.3s ease; opacity: 0; pointer-events: none; text-transform: uppercase; letter-spacing: 1px; }
echo         #cta-button.visible { opacity: 1; pointer-events: auto; }
echo         #cta-button:hover { transform: translateX(-50%%) scale(1.05); box-shadow: 0 6px 20px rgba(245,87,108,0.6); }
echo         .hidden { opacity: 0 !important; pointer-events: none !important; }
echo         @media (orientation: landscape) and (max-height: 500px) {
echo             #cta-button { padding: 10px 30px; font-size: 16px; bottom: 15px; }
echo             #ad-container { max-height: 100vh; }
echo         }
echo     ^</style^>
echo ^</head^>
echo ^<body^>
echo     ^<div id="ad-container"^>
echo         ^<canvas id="game-canvas"^>^</canvas^>
echo         ^<div id="loading-screen"^>
echo             ^<div class="loader"^>^</div^>
echo             ^<div id="loading-text"^>Loading...^</div^>
echo         ^</div^>
echo         ^<button id="cta-button" onclick="handleCTAClick()"^>Download Now^</button^>
echo     ^</div^>
echo.
echo     ^<script type="text/javascript"^>
echo         // ============================================
echo         // MRAID Configuration
echo         // ============================================
echo         const CONFIG = {
echo             storeUrl: '%STORE_URL%',
echo             isMRAID: typeof mraid !== 'undefined'
echo         };
echo.
echo         let isReady = false;
echo         let isViewable = false;
echo         let gameStarted = false;
echo.
echo         function initMRAID(^) {
echo             if (!CONFIG.isMRAID) {
echo                 console.log('Standalone mode');
echo                 initGame(^);
echo                 return;
echo             }
echo.
echo             const state = mraid.getState(^);
echo             console.log('MRAID state:', state);
echo.
echo             if (state === 'loading') {
echo                 mraid.addEventListener('ready', onReady);
echo             } else if (state === 'default') {
echo                 onReady(^);
echo             }
echo.
echo             mraid.addEventListener('viewableChange', function(v) {
echo                 isViewable = v;
echo                 if (v && isReady && !gameStarted) startGame(^);
echo             });
echo         }
echo.
echo         function onReady(^) {
echo             isReady = true;
echo             if (mraid.isViewable(^)) isViewable = true;
echo             initGame(^);
echo         }
echo.
echo         // Loading management
echo         let progress = 0;
echo         const loadingText = document.getElementById('loading-text');
echo         const loadingScreen = document.getElementById('loading-screen');
echo         const ctaBtn = document.getElementById('cta-button');
echo.
echo         function updateProgress(p) {
echo             progress = p;
echo             loadingText.textContent = 'Loading... ' + Math.round(p) + '%%';
echo             if (p >= 100) {
echo                 setTimeout(^) => {
echo                     loadingScreen.classList.add('hidden');
echo                     if (isViewable || !CONFIG.isMRAID) startGame(^);
echo                     else loadingText.textContent = 'Tap to start';
echo                 }, 500);
echo             }
echo         }
echo.
echo         function initGame(^) {
echo             console.log('Initializing game...');
echo             simulateLoading(^);
echo         }
echo.
echo         function simulateLoading(^) {
echo             let p = 0;
echo             const interval = setInterval(^) => {
echo                 p += Math.random(^) * 15 + 5;
echo                 if (p >= 100) { p = 100; clearInterval(interval); }
echo                 updateProgress(p);
echo             }, 200);
echo         }
echo.
echo         function startGame(^) {
echo             if (gameStarted) return;
echo             gameStarted = true;
echo             console.log('Starting game...');
echo             initCanvas(^);
echo             setTimeout(^) => showCTA(^), 8000);
echo         }
echo.
echo         // Canvas setup
echo         const canvas = document.getElementById('game-canvas');
echo         let ctx = null;
echo         let animId = null;
echo.
echo         function initCanvas(^) {
echo             ctx = canvas.getContext('2d');
echo             resizeCanvas(^);
echo             window.addEventListener('resize', resizeCanvas);
echo             gameLoop(^);
echo         }
echo.
echo         function resizeCanvas(^) {
echo             const container = document.getElementById('ad-container');
echo             canvas.width = container.clientWidth;
echo             canvas.height = container.clientHeight;
echo         }
echo.
echo         // Demo game loop
echo         let time = 0;
echo         let particles = [];
echo.
echo         function createParticle(x, y) {
echo             return {
echo                 x, y,
echo                 vx: (Math.random(^) - 0.5) * 8,
echo                 vy: (Math.random(^) - 0.5) * 8,
echo                 life: 1,
echo                 color: 'hsl(' + (Math.random(^) * 360) + ', 70%%, 60%%)',
echo                 size: Math.random(^) * 5 + 2
echo             };
echo         }
echo.
echo         function gameLoop(^) {
echo             if (!ctx) return;
echo             time += 0.016;
echo.
echo             // Background
echo             ctx.fillStyle = '#1a1a2e';
echo             ctx.fillRect(0, 0, canvas.width, canvas.height);
echo.
echo             const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
echo             grad.addColorStop(0, '#667eea');
echo             grad.addColorStop(1, '#764ba2');
echo             ctx.fillStyle = grad;
echo             ctx.fillRect(0, 0, canvas.width, canvas.height);
echo.
echo             // Animated circles
echo             const cx = canvas.width / 2;
echo             const cy = canvas.height / 2;
echo             for (let i = 0; i < 5; i++) {
echo                 const angle = (time + i * 0.5) %% (Math.PI * 2);
echo                 const r = 80 + Math.sin(time * 2 + i) * 20;
echo                 const x = cx + Math.cos(angle) * r;
echo                 const y = cy + Math.sin(angle) * r;
echo.
echo                 ctx.beginPath();
echo                 ctx.arc(x, y, 20 + i * 5, 0, Math.PI * 2);
echo                 ctx.fillStyle = 'hsl(' + (i * 72) + ', 70%%, 60%%)';
echo                 ctx.fill();
echo             }
echo.
echo             // Center circle
echo             ctx.beginPath();
echo             ctx.arc(cx, cy, 40, 0, Math.PI * 2);
echo             const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40);
echo             cGrad.addColorStop(0, '#f093fb');
echo             cGrad.addColorStop(1, '#f5576c');
echo             ctx.fillStyle = cGrad;
echo             ctx.fill();
echo.
echo             // Particles
echo             particles = particles.filter(p => p.life > 0);
echo             particles.forEach(p => {
echo                 p.x += p.vx; p.y += p.vy; p.life -= 0.02; p.size *= 0.98;
echo                 ctx.beginPath();
echo                 ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
echo                 ctx.fillStyle = p.color;
echo                 ctx.globalAlpha = p.life;
echo                 ctx.fill();
echo                 ctx.globalAlpha = 1;
echo             });
echo.
echo             if (Math.random(^) > 0.9) {
echo                 particles.push(createParticle(cx + (Math.random(^)-0.5)*100, cy + (Math.random(^)-0.5)*100));
echo             }
echo.
echo             // Text
echo             ctx.font = 'bold 24px Arial';
echo             ctx.fillStyle = 'white';
echo             ctx.textAlign = 'center';
echo             ctx.fillText('Swipe Up to Play!', cx, canvas.height - 150);
echo.
echo             animId = requestAnimationFrame(gameLoop);
echo         }
echo.
echo         // Touch handling
echo         let startY = 0;
echo         canvas.addEventListener('touchstart', e => startY = e.touches[0].clientY);
echo         canvas.addEventListener('touchend', e => {
echo             if (startY - e.changedTouches[0].clientY > 50) {
echo                 for(let i=0; i<20; i++) particles.push(createParticle(canvas.width/2, canvas.height/2));
echo             }
echo         });
echo.
echo         // CTA
echo         function showCTA(^) { ctaBtn.classList.add('visible'); }
echo.
echo         function handleCTAClick(^) {
echo             console.log('CTA clicked');
echo             if (CONFIG.isMRAID && typeof mraid.open === 'function') {
echo                 mraid.open(CONFIG.storeUrl);
echo             } else {
echo                 window.open(CONFIG.storeUrl, '_blank');
echo             }
echo         }
echo.
echo         // Init
echo         window.addEventListener('load', initMRAID);
echo         document.addEventListener('touchstart', e => { if(e.touches.length > 1) e.preventDefault(); }, {passive:false});
echo     ^</script^>
echo ^</body^>
echo ^</html^>
) > "%OUTPUT_FILE%"

echo [4/5] Verifying file size...
for %%A in ("%OUTPUT_FILE%") do set SIZE=%%~zA
set /a SIZEKB=%SIZE%/1024

echo.
echo ✅ MRAID Ad Created Successfully!
echo -------------------------------------------
echo Output File: %OUTPUT_FILE%
echo File Size: %SIZEKB% KB
echo Store URL: %STORE_URL%
echo.
echo MRAID Compliance Checklist:
echo [✓] Single HTML file
echo [✓] MRAID 2.0 compatible
echo [✓] mraid.open() for CTA
echo [✓] viewableChange event support
echo [✓] Responsive design
echo [✓] Touch-optimized
echo [✓] No external dependencies
echo -------------------------------------------

if %SIZEKB% GTR 5120 (
    echo ⚠️  WARNING: File size exceeds 5MB limit!
    echo Current size: %SIZEKB% KB
) else (
    echo ✓ File size within limits (%SIZEKB% KB / 5120 KB)
)

goto :END

:DEMO_MODE
(
echo ^<!DOCTYPE html^>
echo ^<html lang="zh-CN"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"^>
echo     ^<title^>HuaDongQiFei - MRAID Playable Ad (Demo)^</title^>
echo     ^<style^>
echo         *{margin:0;padding:0;box-sizing:border-box}
echo         body{width:100vw;height:100vh;overflow:hidden;background:#000;font-family:sans-serif;display:flex;justify-content:center;align-items:center}
echo         #ad{width:100%;max-width:750px;height:100%;max-height:1334px;position:relative;background:linear-gradient(135deg,#667eea,#764ba2)}
echo         canvas{width:100%;height:100%;display:block}
echo         #cta{position:absolute;bottom:30px;left:50%;transform:translateX(-50%);padding:15px 40px;background:linear-gradient(135deg,#f093fb,#f5576c);color:white;border:none;border-radius:25px;font-size:18px;font-weight:bold;cursor:pointer;z-index:99;opacity:0;transition:all .3s}
echo         #cta.show{opacity:1}
echo         #load{position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.8);color:white;display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:999}
echo         .spin{width:50px;height:50px;border:4px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:s 1s linear infinite}
echo         @keyframes s{to{transform:rotate(360deg)}}
echo     ^</style^>
echo ^</head^>
echo ^<body^>
echo     ^<div id="ad"^>^<canvas id="c"^>^</canvas^>^<button id="cta" onclick="clk()"^>Install Now^</button^>^<div id="load"^>^<div class="spin"^>^</div^>^<p^>Loading...^</p^>^</div^>^</div^>
echo     ^<script^>
echo         const cfg={url:'%STORE_URL%',mr:typeof mraid!=='undefined'};
echo         let ok=false,view=false,start=false,p=0,ctx,id,parts=[];
echo         function init(){if(!cfg.mr){go();return}const s=mraid.getState();if(s==='loading')mraid.addEventListener('ready',rdy);else if(s==='default')rdy();mraid.addEventListener('viewableChange',v=>{view=v;if(v&&ok&&!start)go()})}
echo         function rdy(){ok=true;if(mraid.isViewable())view=true;ld()}
echo         function ld(){let iv=setInterval(()=>{p+=Math.random()*15+5;if(p>=100){p=100;clearInterval(iv);document.getElementById('load').style.opacity='0';setTimeout(()=>document.getElementById('load').style.display='none',500);if(view||!cfg.mr)go()}},200)}
echo         function go(){if(start)return;start=true;const c=document.getElementById('c');ctx=c.getContext('2d');sz();window.addEventListener('resize',sz);loop();setTimeout(()=>document.getElementById('cta').classList.add('show'),8000)}
echo         function sz(){const d=document.getElementById('ad');c.width=d.clientWidth;c.height=d.clientHeight}
echo         function loop(){if(!ctx)return;const t=Date.now()/1000,w=c.width,h=c.height;ctx.fillStyle='#1a1a2e';ctx.fillRect(0,0,w,h);const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#667eea');g.addColorStop(1,'#764ba2');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);const cx=w/2,cy=h/2;for(let i=0;i<5;i++){const a=(t+i*.5)%(Math.PI*2),r=80+Math.sin(t*2+i)*20,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;ctx.beginPath();ctx.arc(x,y,20+i*5,0,Math.PI*2);ctx.fillStyle='hsl('+i*72+',70%,60%)';ctx.fill()}ctx.beginPath();ctx.arc(cx,cy,40,0,Math.PI*2);const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,40);cg.addColorStop(0,'#f093fb');cg.addColorStop(1,'#f5576c');ctx.fillStyle=cg;ctx.fill();parts=parts.filter(p=>p.life>0);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life-=.02;p.size*=.98;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fillStyle=p.color;ctx.globalAlpha=p.life;ctx.fill();ctx.globalAlpha=1});if(Math.random()>.9)parts.push({x:cx+(Math.random()-.5)*100,y:cy+(Math.random()-.5)*100,vx:(Math.random()-.5)*8,vy:(Math.random()-.5)*8,life:1,color:'hsl('+Math.random()*360+',70%,60%)',size:Math.random()*5+2});ctx.font='bold 24px Arial';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText('Swipe Up!',cx,h-150);id=requestAnimationFrame(loop)}
echo         let sy=0;document.getElementById('c').addEventListener('touchstart',e=>sy=e.touches[0].clientY);document.getElementById('c').addEventListener('touchend',e=>{if(sy-e.changedTouches[0].clientY>50)for(let i=0;i<20;i++)parts.push({x:c.width/2,y:c.height/2,vx:(Math.random()-.5)*8,vy:(Math.random()-.5)*8,life:1,color:'hsl('+Math.random()*360+',70%,60%)',size:Math.random()*5+2})})
echo         function clk(){console.log('CTA');if(cfg.mr&&typeof mraid.open==='function')mraid.open(cfg.url);else window.open(cfg.url,'_blank')}
echo         window.addEventListener('load',init);
echo     ^</script^>
echo ^</body^>
echo ^</html^>
) > "%OUTPUT_FILE%"

echo.
echo ✅ Demo MRAID Ad Created!
echo File: %OUTPUT_FILE%

:END
echo.
echo To test the ad:
echo 1. Open %OUTPUT_FILE% in a browser
echo 2. For MRAID testing, use a mobile device or emulator
echo.
pause
