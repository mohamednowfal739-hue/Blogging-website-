const state = {
  user: JSON.parse(localStorage.getItem("msUser") || "null"),
  posts: JSON.parse(localStorage.getItem("msPosts") || "[]"),
  following: Number(localStorage.getItem("msFollowing") || 0),
  notifications: JSON.parse(localStorage.getItem("msNotifications") || "[]")
};

const $ = id => document.getElementById(id);

function save(){
  localStorage.setItem("msUser", JSON.stringify(state.user));
  localStorage.setItem("msPosts", JSON.stringify(state.posts));
  localStorage.setItem("msFollowing", state.following);
  localStorage.setItem("msNotifications", JSON.stringify(state.notifications));
}

function login(){
  const name = $("loginName").value.trim() || "M S Nowfal";
  state.user = {name, handle:"@" + name.toLowerCase().replace(/\s+/g,"")};
  save(); startApp();
}

function googleLogin(){
  state.user = {name:"M S Nowfal",handle:"@nowfal"};
  save(); startApp();
}

function logout(){
  state.user = null;
  save();
  $("app").classList.add("hidden");
  $("loginScreen").classList.remove("hidden");
}

function startApp(){
  $("loginScreen").classList.add("hidden");
  $("app").classList.remove("hidden");
  updateProfile();
  renderAll();
}

function escapeHTML(str){
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function formatTime(ts){
  const mins = Math.floor((Date.now()-ts)/60000);
  if(mins < 1) return "just now";
  if(mins < 60) return mins+"m";
  if(mins < 1440) return Math.floor(mins/60)+"h";
  return Math.floor(mins/1440)+"d";
}

function addPost(){
  const text = $("postText").value.trim();
  if(!text) return alert("Write something first.");
  const image = $("imageUrl").value.trim();
  state.posts.unshift({
    id:Date.now(),
    name:state.user?.name || "M S Nowfal",
    handle:state.user?.handle || "@nowfal",
    text,
    image,
    likes:0,
    liked:false,
    reposts:0,
    comments:[],
    time:Date.now()
  });
  $("postText").value="";
  $("imageUrl").value="";
  $("charCount").textContent="0/280";
  save(); notify("Your post was published.");
  renderAll();
}

function toggleLike(id){
  const p=state.posts.find(x=>x.id===id);
  if(!p)return;
  p.liked=!p.liked;
  p.likes += p.liked ? 1 : -1;
  save(); renderAll();
}

function repost(id){
  const p=state.posts.find(x=>x.id===id);
  if(!p)return;
  p.reposts++;
  save(); notify("Post reposted.");
  renderAll();
}

function sharePost(id){
  const p=state.posts.find(x=>x.id===id);
  if(!p)return;
  const text=`${p.name}: ${p.text}`;
  if(navigator.share) navigator.share({title:"M S BLOGGING",text});
  else navigator.clipboard?.writeText(text);
  notify("Post shared.");
}

function commentPost(id){
  const p=state.posts.find(x=>x.id===id);
  if(!p)return;
  const text=prompt("Write your comment:");
  if(!text?.trim())return;
  p.comments.push({name:state.user?.name||"You",text:text.trim()});
  save(); renderAll();
}

function toggleFollow(btn){
  const isFollowing=btn.classList.toggle("following");
  btn.textContent=isFollowing?"Following":"Follow";
  state.following += isFollowing ? 1 : -1;
  save(); updateProfile();
}

function renderPost(p){
  const comments=(p.comments||[]).map(c=>`
    <div class="comment"><b>${escapeHTML(c.name)}</b>${escapeHTML(c.text)}</div>
  `).join("");

  return `
  <article class="post card">
    <div class="post-head">
      <div class="avatar">${escapeHTML((p.name||"M")[0].toUpperCase())}</div>
      <div><h3>${escapeHTML(p.name)}</h3><span>${escapeHTML(p.handle)} · ${formatTime(p.time)}</span></div>
    </div>
    <div class="post-content">${escapeHTML(p.text)}</div>
    ${p.image ? `<img class="post-image" src="${escapeHTML(p.image)}" alt="Post image" onerror="this.style.display='none'">` : ""}
    <div class="post-actions">
      <button class="action ${p.liked?'liked':''}" onclick="toggleLike(${p.id})">♥ ${p.likes}</button>
      <button class="action" onclick="commentPost(${p.id})">💬 ${p.comments?.length||0}</button>
      <button class="action" onclick="repost(${p.id})">↻ ${p.reposts||0}</button>
      <button class="action" onclick="sharePost(${p.id})">↗ Share</button>
    </div>
    ${comments ? `<div class="comments">${comments}</div>` : ""}
  </article>`;
}

function renderFeed(list=state.posts){
  $("feed").innerHTML=list.length ? list.map(renderPost).join("") :
    `<div class="card" style="padding:25px;color:#888">No posts yet. Be the first to post.</div>`;
}

function renderProfile(){
  $("profileFeed").innerHTML=state.posts.filter(p=>p.handle===state.user?.handle).map(renderPost).join("") ||
    `<div class="card" style="padding:25px;color:#888">Your posts will appear here.</div>`;
}

function updateProfile(){
  const name=state.user?.name||"M S Nowfal";
  const handle=state.user?.handle||"@nowfal";
  $("sideName").textContent=name;
  $("sideHandle").textContent=handle;
  $("profileName").textContent=name;
  $("profileHandle").textContent=handle;
  $("sideAvatar").textContent=name[0].toUpperCase();
  $("postCount").textContent=state.posts.filter(p=>p.handle===handle).length;
  $("followingCount").textContent=state.following;
  $("followersCount").textContent=128;
}

function searchPosts(){
  const q=$("searchInput").value.toLowerCase().trim();
  const result=state.posts.filter(p =>
    p.text.toLowerCase().includes(q) ||
    p.name.toLowerCase().includes(q) ||
    p.handle.toLowerCase().includes(q)
  );
  $("exploreFeed").innerHTML=result.map(renderPost).join("") ||
    `<div class="card" style="padding:25px;color:#888">No matching posts.</div>`;
}

function quickSearch(q){
  showSection("explore");
  $("searchInput").value=q;
  searchPosts();
}

function notify(text){
  state.notifications.unshift({text,time:Date.now()});
  state.notifications=state.notifications.slice(0,20);
  save(); renderNotifications();
}

function renderNotifications(){
  $("notifyBadge").textContent=state.notifications.length;
  $("notificationList").innerHTML=state.notifications.length ?
    state.notifications.map(n=>`<div class="notice">${escapeHTML(n.text)}<small style="display:block;color:#666;margin-top:4px">${formatTime(n.time)}</small></div>`).join("") :
    `<div class="notice">No notifications yet.</div>`;
}

function renderAll(){
  renderFeed();
  renderProfile();
  renderNotifications();
  searchPosts();
  updateProfile();
}

function showSection(id){
  document.querySelectorAll(".page-section").forEach(s=>s.classList.add("hidden"));
  $(id).classList.remove("hidden");
  document.querySelectorAll(".side-btn").forEach(b=>b.classList.remove("active"));
}

function focusComposer(){
  showSection("home");
  $("postText").focus();
  window.scrollTo({top:0,behavior:"smooth"});
}

function editProfile(){
  const name=prompt("Enter your display name:",state.user?.name||"M S Nowfal");
  if(!name?.trim())return;
  state.user.name=name.trim();
  state.user.handle="@"+name.toLowerCase().replace(/\s+/g,"");
  save(); updateProfile();
}

function sendMessage(){
  const input=$("messageInput");
  if(!input.value.trim())return;
  const div=document.createElement("div");
  div.className="sent";
  div.textContent="You: "+input.value.trim();
  $("sentMessages").prepend(div);
  input.value="";
}

function toggleTheme(){
  document.body.classList.toggle("light");
}

$("postText").addEventListener("input",()=>{
  $("charCount").textContent=$("postText").value.length+"/280";
});

if(state.user) startApp();
else {
  $("app").classList.add("hidden");
  $("loginScreen").classList.remove("hidden");
}
