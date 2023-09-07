let is_login;
let current_user;
document.addEventListener('DOMContentLoaded', function(){
    is_login = document.querySelector('#user').dataset.login;
    current_user = document.querySelector('#user').dataset.name;

    document.querySelector('#nav-index').addEventListener('click',()=>load_index_page());
    document.querySelector('#nav-all').addEventListener('click',()=>load_index_page());
    if(is_login == 'True'){
        document.querySelector('#nav-user').addEventListener('click',()=>load_user_page(current_user));
        document.querySelector('#nav-following').addEventListener('click',()=>load_following_page());
    }
    load_index_page();
});

async function get_like(urls){
    const array = [];
    urls.forEach(url => {
        array.push(fetch(`/posts/${url}/like`));
    });
    try{
        const res = await Promise.all(array);
        const data = await Promise.all(res.map((item) =>{
            return item.json();
        }));
        obj = {};
        for(let i = 0; i < urls.length; i++){
            obj[urls[i]] = data[i];
        }
        return obj;
    } catch(e){
        console.log('Multiple fetch failed');
    }
};

function load_postbox(postbox_title, page_number){
    fetch(`/posts/${postbox_title}/${page_number}`)
    .then(respone => respone.json())
    .then(async(data) => {
        const posts = data.posts;
        const postbox = document.querySelector('#postbox');
        postbox.innerHTML = '';
        urls = [];
        posts.forEach(post => {
            urls.push(post.id);
        });
        let post_like;
        await (async () => {
            post_like = await get_like(urls);
        })();
        posts.forEach(post => {
            const element = document.createElement('div');
            element.dataset.id = post.id;
            element.classList.add('border', 'mr-3', 'ml-3', 'mt-2', 'p-3');
            element.innerHTML+= `<h5 data-user_name="${post.user.username}" class="user-link">${post.user.username}</h5>`;
            if (current_user == post.user.username)
            {
                element.innerHTML+= '<div class="edit-btn text-primary">Edit</div>';
            }
            element.innerHTML+= `<div class="">${post.content}</div>`;
            element.innerHTML+= `<div class="font-weight-light">${post.timestamp}</div>`;
            const like_element = document.createElement('div');
            if(post_like[post.id].is_liked){
                like_element.innerHTML += '<i class="like-btn fa-solid fa-heart"></i>';
            }
            else{
                like_element.innerHTML += '<i class="like-btn fa-regular fa-heart"></i>';
            }
            like_element.innerHTML += `<span class="ml-1" data-id="${post.id}">${post_like[post.id].total_like}</span>`;
            element.append(like_element);
            element.innerHTML += '<div class="comment-btn text-primary">Comment</div>';
            postbox.append(element);

        });
        document.querySelectorAll('.user-link').forEach(link => {
            link.addEventListener('click', event =>{
                const user_link = event.target;
                load_user_page(user_link.dataset.user_name);
            });
        });
        if(is_login != 'False'){
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', event =>{
                    const edit_btn = event.target;
                    const parent = edit_btn.parentElement;
                    const content_ele = edit_btn.nextElementSibling;
                    const content_txtarea = document.createElement('textarea');
                    const btn_save = document.createElement('button');
                    content_txtarea.classList.add('form-control');
                    content_txtarea.value = content_ele.innerHTML;
                    btn_save.classList.add('btn','btn-primary','btn-sm');
                    btn_save.innerHTML = 'Save';
                    parent.replaceChild(content_txtarea,content_ele);
                    parent.replaceChild(btn_save, edit_btn);
                    btn_save.onclick = function(){
                        const content = content_txtarea.value;
                        content_ele.innerHTML = content;
                        parent.replaceChild(content_ele, content_txtarea);
                        parent.replaceChild(edit_btn,btn_save);
                        fetch(`/posts/${parseInt(parent.dataset.id)}/edit`, {
                            method: 'PUT',
                            body: JSON.stringify({
                                content: content
                            })
                        });
                    };
                });
            });
            document.querySelectorAll('.like-btn').forEach(btn => {
                btn.addEventListener('click', event =>{
                    btn_like = event.target;
                    btn_class = btn_like.classList;
                    next_sb = btn_like.nextElementSibling;
                    total_like = parseInt(next_sb.innerHTML);
                    post_id = next_sb.dataset.id;
                    if( btn_class.contains('fa-solid')){
                        btn_class.remove('fa-solid');
                        btn_class.add('fa-regular');
                        total_like--;
                        next_sb.innerHTML = total_like;
                        liked = false;
                    }
                    else{
                        btn_class.remove('fa-regular');
                        btn_class.add('fa-solid');
                        total_like++;
                        next_sb.innerHTML = total_like;
                        liked = true;
                    }
                    fetch(`/posts/${post_id}/like`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            liked: liked
                        })
                    });
                });
            });
        }
        const pagnination = document.querySelector('#pagination');
        const pre_ele = pagnination.firstElementChild;
        pre_ele.classList.remove('disabled');
        const next_ele = pagnination.lastElementChild;
        next_ele.classList.remove('disabled');
        pagnination.innerHTML = '';
        pagnination.append(pre_ele);
        pagnination.append(next_ele);
        const pag_next = document.querySelector('#pag-next');
        const pag_pre = document.querySelector('#pag-pre');
        data.range.forEach(num => {
            const li = document.createElement('li');
            li.classList.add('page-item');
            li.innerHTML = `<button class="pag-number page-link">${num}</button>`
            if(num == page_number){
                li.classList.add('active');
            }
            pagnination.insertBefore(li, pagnination.lastElementChild);
        });
        if(!data.has_previous){
            pag_pre.parentElement.classList.add('disabled');
        }
        if(!data.has_next){
            pag_next.parentElement.classList.add('disabled');
        }
        pag_pre.onclick = () => {
            load_postbox(postbox_title, page_number-1);
        }
        pag_next.onclick = () => {
            load_postbox(postbox_title, page_number+1);
        }
        document.querySelectorAll('.pag-number').forEach(btn => {
            btn.addEventListener('click', event => {
                load_postbox(postbox_title, parseInt(event.target.innerHTML));
            });
        });
    });
};
function load_index_page(){
    document.querySelector('#index-view').style.display = 'block';
    document.querySelector('#user-view').style.display = 'none';
    document.querySelector('#post-page-view').style.display = 'none';
    document.querySelector('#following-view').style.display = 'none';
    if (is_login  == 'True'){
        document.querySelector('#posting-form').onsubmit = () => {
            const input = document.querySelector('#posting-content')
            const content = input.value;
            input.value = '';
            fetch('/posts', {
                method: 'POST',
                body: JSON.stringify({
                    content: content
                })
            })
            .then(respone => respone.json())
            .then(result => {
                console.log(result.message);
                load_index_page();
            });
            return false;
        };
    }

    load_postbox('index',1);
}

function load_user_page(username){
    document.querySelector('#index-view').style.display = 'none';
    document.querySelector('#user-view').style.display = 'block';
    document.querySelector('#post-page-view').style.display = 'none';
    document.querySelector('#following-view').style.display = 'none';
    fetch(`/users/${username}`)
    .then(respone => respone.json())
    .then(async(user) =>{
        const user_view = document.querySelector('#user-view');
        document.querySelector('#user-name').innerHTML = user.username;
        document.querySelector('#user-email').innerHTML = user.email;

        const respone = await fetch(`/users/${user.username}/follow`);
        const data = await respone.json();

        document.querySelector('#user-following').innerHTML = data.following;
        document.querySelector('#user-followers').innerHTML = data.followers;
        const follow_btn = document.querySelector('#follow-btn');
        const fol_btn_class = follow_btn.classList;
        if(is_login == 'True' && current_user != user.username)
        {
            follow_btn.style.display = 'block';
            if(data.is_followed){
                follow_btn.innerHTML = 'Unfollow';
                fol_btn_class.add('btn-light')
            }
            else{
                follow_btn.innerHTML = 'Follow';
                fol_btn_class.add('btn-outline-light')
            }
        }
        else{
            follow_btn.style.display = 'none';
        }
        follow_btn.onclick = () => {
            followers = document.querySelector('#user-followers')
            if (fol_btn_class.contains('btn-light')){
                follow_btn.innerHTML = 'Follow';
                fol_btn_class.remove('btn-light')
                fol_btn_class.add('btn-outline-light')
                is_followed = false;
                followers.innerHTML = parseInt(followers.innerHTML)-1;
            }
            else{
                follow_btn.innerHTML = 'Unfollow';
                fol_btn_class.remove('btn-outline-light')
                fol_btn_class.add('btn-light')
                is_followed = true;
                followers.innerHTML = parseInt(followers.innerHTML)+1;
            }
            fetch(`/users/${user.username}/follow`, {
                method: 'PUT',
                body: JSON.stringify({
                    followed: is_followed
                })
            });
        }
        load_postbox(username,1);

    })
}

function load_following_page(){
    document.querySelector('#index-view').style.display = 'none';
    document.querySelector('#user-view').style.display = 'none';
    document.querySelector('#post-page-view').style.display = 'none';
    document.querySelector('#following-view').style.display = 'block';
    load_postbox('follow',1);
}