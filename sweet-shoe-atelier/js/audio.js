'use strict';
(function(A){
  // All action cues are local Kenney CC0 recordings; no oscillator substitutes.
  const SAMPLES=['tap','spawn','merge','coin','switch','pick','drop','box','ribbon','delivery','level','error','unlock','sparkle'];
  const ALIASES={click:'tap',generate:'spawn',pop:'spawn',navigation:'switch',whoosh:'switch',
    discovery:'unlock',renovate:'level',renovation:'level',chapter:'level',guide:'sparkle',crate:'box',ding:'sparkle',tryon:'sparkle'};
  A.SFX_FILES=SAMPLES.flatMap(name=>['ogg','mp3'].map(ext=>'assets/sfx/'+name+'.'+ext));
  A.createAudioEngine=function(getState,blocked,getScene=()=> 'merge'){
    const engine={ctx:null,master:null,effects:null,music:null,tick:null,step:0,voices:new Set(),lastCue:new Map(),limit:32,
      tracks:new Map(),failedTracks:new Set(),trackRetryAfter:new Map(),currentTrack:null,buffers:new Map(),sampleLoads:new Map(),sampleRetryAfter:new Map(),effectGeneration:0,
      loadSample(name){
        // Browsers block fetch() for local file URLs as cross-origin requests.
        // Keep local previews quiet instead of issuing a failing request per cue.
        if(location.protocol==='file:')return Promise.resolve(null);
        if(this.buffers.has(name))return Promise.resolve(this.buffers.get(name));
        if(this.sampleLoads.has(name))return this.sampleLoads.get(name);
        // A temporary connection/decoder failure must not mute a cue until reload.
        // Retry from a later gesture, with a short backoff for unavailable assets.
        if(Date.now()<(this.sampleRetryAfter.get(name)||0))return Promise.resolve(null);
        if(typeof fetch!=='function'||!this.ctx?.decodeAudioData)return Promise.resolve(null);
        const load=(async()=>{
          for(const ext of ['ogg','mp3'])try{
            const response=await fetch('assets/sfx/'+name+'.'+ext);
            if(!response.ok)continue;
            const bytes=await response.arrayBuffer();
            const buffer=await new Promise((resolve,reject)=>this.ctx.decodeAudioData(bytes,resolve,reject));
            this.buffers.set(name,buffer);this.sampleRetryAfter.delete(name);return buffer;
          }catch{}
          this.sampleRetryAfter.set(name,Date.now()+1500);return null;
        })();
        this.sampleLoads.set(name,load);
        load.then(()=>{if(this.sampleLoads.get(name)===load)this.sampleLoads.delete(name);});
        return load;
      },
      preload(){for(const name of SAMPLES)this.loadSample(name);},
      sample(name,rate=1,volume=.45,offset=0){
        const buffer=this.buffers.get(name);
        if(!buffer||!this.ctx||!getState().sound||blocked())return;
        try{
          if([...this.voices].filter(voice=>voice.name===name).length>=3)return;
          if(this.voices.size>=this.limit)this.voices.values().next().value.stop();
          const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();
          let ended=false;
          const cleanup=()=>{if(ended)return;ended=true;source.disconnect();gain.disconnect();this.voices.delete(voice);};
          const voice={name,bus:this.effects,stop:()=>{try{source.stop();}catch{}cleanup();}};
          source.buffer=buffer;source.playbackRate.value=rate;gain.gain.value=volume;
          source.connect(gain);gain.connect(this.effects);source.onended=cleanup;
          this.voices.add(voice);source.start(this.ctx.currentTime+offset);
        }catch{}
      },
      track(name){
        if(this.tracks.has(name))return this.tracks.get(name);
        const audio=new window.Audio();audio.preload='none';audio.loop=true;audio.playsInline=true;
        // raw.githack refuses large MP3s (403/301), so commit-pinned previews stream
        // the same file from jsDelivr. Packaged builds keep the relative path.
        // Do not remove: without it previews fall back to silence.
        const githack=/(^|\.)githack\.com$/.test(location.hostname);
        if(githack){audio.crossOrigin='anonymous';const ref=(location.pathname.split('/')[3]||'sweet-shoe-preview');audio.src='https://cdn.jsdelivr.net/gh/pu873967671-code/vibe-coding@'+ref+'/sweet-shoe-atelier/assets/audio/bgm_'+name+'.mp3';}
        else audio.src='assets/audio/bgm_'+name+'.mp3';
        const source=this.ctx.createMediaElementSource(audio),gain=this.ctx.createGain();
        gain.gain.value=0;source.connect(gain);gain.connect(this.music);
        const track={audio,source,gain,stopTimer:null,primed:false};
        this.tracks.set(name,track);audio.addEventListener('error',()=>this.mediaFailed(name));
        return track;
      },
      primeMusic(){
        if(!getState().music||!window.Audio||!this.ctx.createMediaElementSource)return;
        // Safari grants playback per element. Warm both local scene tracks in
        // the first gesture so an automatic post-pack scene change can play too.
        for(const name of ['tea']){
          if(this.failedTracks.has(name))continue;
          const track=this.track(name);if(track.primed)continue;
          track.primed=true;
          try{
            const result=track.audio.play();
            if(result?.then)result.then(()=>{if(this.currentTrack!==name)track.audio.pause();}).catch(error=>{
              track.primed=false;
              if(error?.name!=='NotAllowedError'&&error?.name!=='AbortError')this.mediaFailed(name);
            });
          }catch{track.primed=false;}
        }
      },
      retryMusic(){
        if(!getState().music)return;
        // A dropped connection must not replace the recorded music for the
        // entire visit. Retry only from ensure(), with the next interaction,
        // so Safari's play() remains in the activation stack and absent files
        // cannot cause an automatic fetch/fallback loop.
        for(const name of [...this.failedTracks]){
          if(Date.now()<(this.trackRetryAfter.get(name)||0))continue;
          this.failedTracks.delete(name);this.trackRetryAfter.delete(name);
          const track=this.tracks.get(name);if(!track)continue;
          track.primed=false;
          try{track.audio.load();}catch{this.mediaFailed(name);}
        }
      },
      media(silent){
        if(silent||!getState().music){
          for(const track of this.tracks.values()){
            clearTimeout(track.stopTimer);track.gain.gain.cancelScheduledValues(this.ctx.currentTime);
            track.gain.gain.setValueAtTime(0,this.ctx.currentTime);track.audio.pause();
          }
          this.currentTrack=null;return false;
        }
        const name='tea'; // user 2026-10-26: the reception track fits everywhere, keep one soft track
        if(this.failedTracks.has(name)||!window.Audio||!this.ctx.createMediaElementSource)return false;
        if(this.currentTrack===name&&!this.tracks.get(name)?.audio.paused)return true;
        try{
          const track=this.track(name);
          this.currentTrack=name;
          for(const [id,other] of this.tracks){
            clearTimeout(other.stopTimer);other.gain.gain.cancelScheduledValues(this.ctx.currentTime);
            other.gain.gain.setTargetAtTime(id===name?.35:0,this.ctx.currentTime,.35);
            if(id!==name)other.stopTimer=setTimeout(()=>{if(this.currentTrack!==id)other.audio.pause();},1500);
          }
          const play=track.audio.play();
          if(play?.catch)play.catch(error=>{
            // Browser activation policy is temporary: retry from the next gesture.
            // Never poison the track or permanently fall back after autoplay denial.
            if(error?.name==='NotAllowedError'||error?.name==='AbortError'){
              if(this.currentTrack===name)this.currentTrack=null;return;
            }
            this.mediaFailed(name);
          });
          return true;
        }catch{this.mediaFailed(name);return false;}
      },
      mediaFailed(name){
        this.failedTracks.add(name);this.trackRetryAfter.set(name,Date.now()+1500);const track=this.tracks.get(name);
        if(track){clearTimeout(track.stopTimer);track.audio.pause();track.gain.gain.setValueAtTime(0,this.ctx.currentTime);}
        if(this.currentTrack===name){this.currentTrack=null;this.update();}
      },
      ensure(){
        if((!getState().sound&&!getState().music)||blocked())return;
        try{
          this.ctx=this.ctx||new(window.AudioContext||window.webkitAudioContext)();
          if(!this.master){
            this.master=this.ctx.createGain();this.master.gain.value=0;this.master.connect(this.ctx.destination);
            this.effects=this.ctx.createGain();this.effects.connect(this.master);
            this.music=this.ctx.createGain();this.music.connect(this.master);
          }
          // Both calls stay synchronous in the click/touch/key gesture stack (Safari).
          if(this.ctx.state==='suspended'||this.ctx.state==='interrupted')this.ctx.resume().catch(()=>{});
          this.preload();
          this.retryMusic();
          this.primeMusic();
          this.update();
        }catch{}
      },
      update(){
        if(!this.master)return;
        const now=this.ctx.currentTime,s=getState(),silent=blocked();
        if(silent||!s.sound)this.effectGeneration++;
        this.master.gain.setTargetAtTime(silent?0:1,now,.035);
        this.effects.gain.setTargetAtTime(s.sound?1:0,now,.025);
        this.music.gain.setTargetAtTime(s.music?1:0,now,.08);
        // Cancel scheduled notes as well as the clock; old fanfares must not resume.
        for(const voice of this.voices)if(silent||(!s.sound&&voice.bus===this.effects)||(!s.music&&voice.bus===this.music))voice.stop();
        const streaming=this.media(silent);
        if(silent||!s.music||streaming){
          if(this.tick!==null){clearInterval(this.tick);this.tick=null;}
          if(streaming)for(const voice of this.voices)if(voice.bus===this.music)voice.stop();
          return;
        }
        if(false&&this.tick===null)this.tick=setInterval(()=>{ // procedural fallback disabled 2026-10-26: user found it not cozy; silence beats beeps
          if(blocked()||!getState().music)return;
          const phrase=[261.63,329.63,392,0,440,392,329.63,0,261.63,349.23,440,0,493.88,392,293.66,0];
          const beat=this.step++%phrase.length,note=phrase[beat];
          if(note)this.voice(note,1.15,.014,'sine',0,this.music);
          if(beat%4===0){this.voice(note/2,2.4,.01,'sine',0,this.music);this.voice(note*.75,1.9,.006,'sine',.12,this.music);}
        },760);
      },
      voice(f,d=.15,vol=.05,type='sine',offset=0,bus=this.effects,end=f){
        if(!this.ctx||!bus)return;
        try{
          // Bound rapid taps and overlapping discoveries on slower phones.
          if(this.voices.size>=this.limit)this.voices.values().next().value.stop();
          const o=this.ctx.createOscillator(),g=this.ctx.createGain(),now=this.ctx.currentTime+offset;
          let ended=false;
          const cleanup=()=>{if(ended)return;ended=true;o.disconnect();g.disconnect();this.voices.delete(voice);};
          const voice={bus,stop:()=>{try{o.stop();}catch{}cleanup();}};
          this.voices.add(voice);
          o.type=type;o.frequency.setValueAtTime(f,now);o.frequency.exponentialRampToValueAtTime(Math.max(30,end),now+d);
          o.connect(g);g.connect(bus);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(vol,now+.008);g.gain.exponentialRampToValueAtTime(.0001,now+d);
          o.onended=cleanup;o.start(now);o.stop(now+d+.015);
        }catch{}
      },
      tone(f,d=.15,vol=.05,type='sine'){if(getState().sound&&!blocked())this.voice(f,d,vol,type);},
      sfx(kind,tier=1){
        if(!getState().sound||blocked()||!this.ctx)return;
        // One meaningful cue per action even when nested controls bubble clicks.
        const name=ALIASES[kind]||kind;
        if(!SAMPLES.includes(name))return;
        const now=this.ctx.currentTime,last=this.lastCue.get(name);
        if(last!==undefined&&now-last<.06)return;
        this.lastCue.set(name,now);
        const generation=this.effectGeneration;
        const play=()=>{
          if(generation!==this.effectGeneration||!getState().sound||blocked())return;
          const variation=1+(Math.random()-.5)*.07;
          if(kind==='coin'){
            const count=Math.min(3,Math.max(1,Math.ceil(Math.sqrt(Math.max(1,tier))/1.5)));
            for(let i=0;i<count;i++)this.sample('coin',variation*(1.06+i*.05),.5,i*.09);
            this.sample('sparkle',variation*1.12,.14,.04);
          }else if(kind==='merge')this.sample(name,variation*Math.pow(1.055,Math.min(7,Math.max(1,tier))-1),.55);
          else this.sample(name,variation,name==='tap'?.18:name==='error'?.28:.48);
        };
        if(this.buffers.has(name))play();
        else {
          const requested=Date.now();
          this.loadSample(name).then(buffer=>{if(buffer&&Date.now()-requested<300)play();});
        }
      }
    };return engine;
  };
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
