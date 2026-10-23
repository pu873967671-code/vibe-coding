'use strict';
(function(A){
  // Local, gesture-unlocked sound. Sleeping music owns no background clock.
  A.createAudioEngine=function(getState,blocked,getScene=()=> 'merge'){
    const engine={ctx:null,master:null,effects:null,music:null,tick:null,step:0,voices:new Set(),lastCue:new Map(),limit:32,
      tracks:new Map(),failedTracks:new Set(),currentTrack:null,
      media(silent){
        if(silent||!getState().music){
          for(const track of this.tracks.values()){
            clearTimeout(track.stopTimer);track.gain.gain.cancelScheduledValues(this.ctx.currentTime);
            track.gain.gain.setValueAtTime(0,this.ctx.currentTime);track.audio.pause();
          }
          this.currentTrack=null;return false;
        }
        const name=getScene()==='merge'?'cozy':'tea';
        if(this.failedTracks.has(name)||!window.Audio||!this.ctx.createMediaElementSource)return false;
        if(this.currentTrack===name)return true;
        try{
          let track=this.tracks.get(name);
          if(!track){
            const audio=new window.Audio();audio.preload='none';audio.loop=true;audio.src='assets/audio/bgm_'+name+'.mp3';
            const source=this.ctx.createMediaElementSource(audio),gain=this.ctx.createGain();
            gain.gain.value=0;source.connect(gain);gain.connect(this.music);
            track={audio,source,gain,stopTimer:null};this.tracks.set(name,track);
            audio.addEventListener('error',()=>this.mediaFailed(name));
          }
          this.currentTrack=name;
          for(const [id,other] of this.tracks){
            clearTimeout(other.stopTimer);other.gain.gain.cancelScheduledValues(this.ctx.currentTime);
            other.gain.gain.setTargetAtTime(id===name?.35:0,this.ctx.currentTime,.35);
            if(id!==name)other.stopTimer=setTimeout(()=>{if(this.currentTrack!==id)other.audio.pause();},1500);
          }
          const play=track.audio.play();
          if(play?.catch)play.catch(error=>{if(error?.name!=='AbortError')this.mediaFailed(name);});
          return true;
        }catch{this.mediaFailed(name);return false;}
      },
      mediaFailed(name){
        this.failedTracks.add(name);const track=this.tracks.get(name);
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
          if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
          this.update();
        }catch{}
      },
      update(){
        if(!this.master)return;
        const now=this.ctx.currentTime,s=getState(),silent=blocked();
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
        if(this.tick===null)this.tick=setInterval(()=>{
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
        const now=this.ctx.currentTime,last=this.lastCue.get(kind);
        if(last!==undefined&&now-last<.035)return;
        this.lastCue.set(kind,now);
        const play=(f,d,v=.04,offset=0,type='sine',end=f)=>this.voice(f,d,v,type,offset,this.effects,end);
        if(kind==='click')play(620,.055,.014,0,'sine',500);
        else if(kind==='generate'||kind==='pop')play(380,.13,.035,0,'sine',750);
        else if(kind==='merge'){const f=440*Math.pow(1.12,Math.min(7,Math.max(1,tier)));play(f,.26,.035,0,'triangle');play(f*1.5,.32,.022,.055);}
        else if(kind==='discovery'){[1,1.25,1.5,2].forEach((n,i)=>play(523.25*n,.5,.022,i*.085));}
        else if(kind==='renovate'){[1,1.25,1.5,2].forEach((n,i)=>play(392*n,.6,.026,i*.11));}
        else if(kind==='chapter'){[261.63,329.63,392,523.25,659.25,783.99].forEach((n,i)=>play(n,.85,.022,i*.09));}
        else if(kind==='guide'||kind==='navigation'){play(523.25,.22,.018);play(659.25,.3,.015,.075);}
        else if(kind==='crate'){play(170,.12,.018,0,'triangle',95);play(780,.2,.012,.06);}
        else if(kind==='delivery'){play(523.25,.3,.025);play(659.25,.38,.02,.09);play(783.99,.48,.018,.18);}
        else if(kind==='coin'){play(1046,.18,.026);play(1397,.28,.018,.07);}
        else if(kind==='whoosh')play(340,.2,.018,0,'triangle',90);
        else if(kind==='ding'){play(880,.4,.035);play(1320,.4,.022,.09);}
      }
    };return engine;
  };
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
