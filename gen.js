// Builds work-shifts.ics: shift rotation, paydays and city holidays.
// Same rules as the Shift Schedule app. Run: node gen.js  (GitHub Actions runs it monthly)
const fs = require("fs");
const CYCLE="OONNNNOOONNNNOOONNNNOOONNNNOMMOOOMMMMOOOMMMMOOOMMMMOOOMMOOMMMMOOOMMMMOOOMMMMOOOMMMMOXXOOOXXXXOOOXXXXOOOXXXXOOOXXOOXXXXOOOXXXXOOOXXXXOOOXXXXONNOOONNNNOOONNNNOOONNNNOOONN";
const ANCHOR=Date.UTC(2025,11,14), PAY0=Date.UTC(2027,0,8);
const SHIFT={M:{name:"Morning",hours:"6:00 AM – 4:00 PM",t:[6,16,0]},N:{name:"Afternoon",hours:"2:00 PM – 12:00 AM",t:[14,0,1]},X:{name:"Night",hours:"9:00 PM – 7:00 AM",t:[21,7,1]}};
const ALARM_MIN=60;
const dn=(y,m,d)=>Math.round(Date.UTC(y,m,d)/864e5);
const ymd=n=>{const t=new Date(n*864e5);return [t.getUTCFullYear(),t.getUTCMonth(),t.getUTCDate()];};
const key=(y,m,d)=>y+"-"+String(m+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");
const shiftN=n=>CYCLE[(((n-ANCHOR/864e5)%168)+168)%168];
const isPayN=n=>(((n-PAY0/864e5)%14)+14)%14===0;
function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,mm=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*mm+114)/31),da=((h+l-7*mm+114)%31)+1;return [mo-1,da];}
const HOLC={};
function holidays(y){
  if(HOLC[y])return HOLC[y];
  const h={},dow=(m,d)=>new Date(Date.UTC(y,m,d)).getUTCDay();
  const nth=(m,wd,n)=>1+((wd-dow(m,1)+7)%7)+7*(n-1);
  const last=(m,wd)=>{const L=new Date(Date.UTC(y,m+1,0));return L.getUTCDate()-((L.getUTCDay()-wd+7)%7);};
  const put=(m,d,nm)=>{h[key(y,m,d)]=nm;};
  put(0,1,"New Year's Day");put(0,nth(0,1,3),"MLK Jr. Day");put(1,nth(1,1,3),"Presidents' Day");
  const [em,ed]=easter(y),es=dn(y,em,ed);
  const off=k=>{const [yy,m,d]=ymd(es+k);put(m,d,k<0?"Good Friday":k>0?"Easter Monday":"Easter Sunday");};
  off(-2);off(1);if(y>=2027)off(0);
  put(4,last(4,1),"Memorial Day");put(5,19,"Juneteenth");put(6,4,"Independence Day");put(8,nth(8,1,1),"Labor Day");
  put(9,nth(9,1,2),"Founder's Day");put(10,11,"Veterans Day");put(10,nth(10,4,4),"Thanksgiving");
  put(11,24,"Christmas Eve");put(11,25,"Christmas");put(11,31,"New Year's Eve");
  return HOLC[y]=h;
}
const BIG4=["New Year's Day","Thanksgiving","Christmas","Easter Sunday"];
const holPay=(y,nm)=>y>=2027?(BIG4.includes(nm)?"double overtime":"overtime"):(BIG4.includes(nm)?"overtime":"city holiday");

const today=new Date(), TY=today.getUTCFullYear();
const from=dn(TY,today.getUTCMonth(),today.getUTCDate())-60, to=dn(TY+1,11,31);
const p2=v=>String(v).padStart(2,"0");
const dt=(n,h)=>{const [y,m,d]=ymd(n);return `${y}${p2(m+1)}${p2(d)}T${p2(h)}0000`;};
const dd=n=>{const [y,m,d]=ymd(n);return `${y}${p2(m+1)}${p2(d)}`;};
const stamp=today.toISOString().replace(/[-:]/g,"").replace(/\.\d+/,"");
const esc=t=>String(t).replace(/\\/g,"\\\\").replace(/;/g,"\;").replace(/,/g,"\\,").replace(/\n/g,"\\n");
const L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Shift Schedule//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH",
  "X-WR-CALNAME:Work Shifts","X-WR-TIMEZONE:America/Chicago","REFRESH-INTERVAL;VALUE=DURATION:P1D","X-PUBLISHED-TTL:P1D",
  "BEGIN:VTIMEZONE","TZID:America/Chicago",
  "BEGIN:DAYLIGHT","TZOFFSETFROM:-0600","TZOFFSETTO:-0500","TZNAME:CDT","DTSTART:19700308T020000","RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU","END:DAYLIGHT",
  "BEGIN:STANDARD","TZOFFSETFROM:-0500","TZOFFSETTO:-0600","TZNAME:CST","DTSTART:19701101T020000","RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU","END:STANDARD",
  "END:VTIMEZONE"];
const allDay=(n,uid,sum,desc)=>{L.push("BEGIN:VEVENT","UID:"+uid,"DTSTAMP:"+stamp,"DTSTART;VALUE=DATE:"+dd(n),"DTEND;VALUE=DATE:"+dd(n+1),"SUMMARY:"+esc(sum),"TRANSP:TRANSPARENT");if(desc)L.push("DESCRIPTION:"+esc(desc));L.push("END:VEVENT");};
let count=0;
for(let n=from;n<=to;n++){
  const [y,m,d]=ymd(n),k=key(y,m,d),s=shiftN(n);
  if(s!=="O"){const S=SHIFT[s],[h1,h2,nx]=S.t;count++;
    L.push("BEGIN:VEVENT","UID:"+k+"-shift@shift-schedule","DTSTAMP:"+stamp,"DTSTART;TZID=America/Chicago:"+dt(n,h1),"DTEND;TZID=America/Chicago:"+dt(n+nx,h2),
      "SUMMARY:"+esc(S.name+" shift"),"LOCATION:"+esc(S.hours),
      "BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+esc(S.name+" shift starts soon"),"TRIGGER:-PT"+ALARM_MIN+"M","END:VALARM","END:VEVENT");}
  if(isPayN(n))allDay(n,k+"-pay@shift-schedule","Payday","");
  const hol=holidays(y)[k];if(hol){const p=holPay(y,hol);allDay(n,k+"-hol@shift-schedule","★ "+hol,p==="city holiday"?"City holiday":"City holiday, paid at "+p);}
}
L.push("END:VCALENDAR");
const out=L.map(l=>{let o="";while(l.length>73){o+=l.slice(0,73)+"\r\n ";l=l.slice(73);}return o+l;}).join("\r\n")+"\r\n";
fs.writeFileSync("work-shifts.ics",out);
console.log(`work-shifts.ics: ${count} shifts, ${key(...ymd(from))} to ${key(...ymd(to))}`);
