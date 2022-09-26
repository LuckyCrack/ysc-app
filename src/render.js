var channels_Titles = [];
var channel_Urls = [];
var channel_Ids = [];
var channel_Avatars = [];
var channel_DataJSON = {};
var data_from_file = {};
var limit = 50;
var promises = [];
var exclude_list = "";
var use_file = 1;
var percentage = 0
var init_list = [];
var curr_list = [];
var rawData = "";
var called = 0;
var data_saved = {}
const cheerio = require('cheerio');
var fs = require('fs');

jQuery(document).ready(function () {
    if(fs.existsSync('config.dat'))
    {
        fs.readFile('config.dat', (err, data) => {
            if (err) throw err;
            var data_saved_p =  JSON.parse(data);
            jQuery('#numberinput').val(data_saved_p.list_count);
            jQuery('#excludeinput').val(data_saved_p.exc_list);
        });
    }
    jQuery('#exampleModalSm').fadeIn('100');
});

async function hidemodal()
{
    limit = parseInt(jQuery('#numberinput').val());
    exclude_list = jQuery('#excludeinput').val();
    var exclude_list_str = exclude_list;
    exclude_list = exclude_list.toLowerCase()
    if(jQuery.isNumeric(limit))
    {
        if(limit > 80)
        {
            limit = 80
        }
        else
        {
            if(limit < 1)
            {
                limit = 1
            }
        }
    }
    else
    {
        limit = 50
    } 
    if(!(isEmptyOrSpaces(exclude_list)))
    {
        exclude_list = exclude_list.split(',');
        console.log(exclude_list);
    }
    jQuery('#exampleModalSm').fadeOut('200');
    if(!(jQuery('#flexSwitchCheckDefault').is(":checked")))
    {
        use_file = 0;
        jQuery('#example2ModalSm').show();
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    data_saved = {list_count: limit, exc_list: exclude_list_str}
    data_saved = JSON.stringify(data_saved);
    fs.writeFile("config.dat", data_saved, function(err) {
        if(err) {
            console.log(err);
        }
    });
    getChannels();
}


function getChannels() 
{
    if(fs.existsSync('data.dat') && use_file==1)
    {
        fs.readFile('data.dat', (err, data) => {
            if (err) throw err;
            channel_DataJSON =  JSON.parse(data);
            renderChannel(channel_DataJSON);
        });
    }
    else
    {
        if(!(fs.existsSync('data.dat')) || use_file==0)
        {
            httpGet('https://socialblade.com/youtube/top/100/mostsubscribed')
            .then((value) => {
                var count = 0;
                var count_in = 0;
                var $ = cheerio.load(value);
                $('#sort-by').next().siblings().each(function() {
                    if(count >= 3 && count < 103)
                    {
                        var title = $(this).find('a').text();
                        var channelName = $(this).find('a').attr('href');
                        channels_Titles.push(title);
                        var channelURL = "https://socialblade.com"+channelName;
                        channel_Urls.push(channelURL);
                        channel_DataJSON[count_in] = {title: title};
                        count_in++;
                    }
                    count++;
                });
                // for (let indexInArr = 0; indexInArr < channel_Urls.length; indexInArr++) {
                //     const valueOfElement = array[indexInArr];
                //     var rawDataId = httpGet2(valueOfElement);
                //     promisz.push(rawDataId);
                // } 
                jQuery.each(channel_Urls, function (indexInArray, valueOfElement) { 
                    httpGet(valueOfElement)
                    .then((rawDataId) => {
                        var isLastElement = indexInArray == channel_Urls.length -1;
                        var $ = cheerio.load(rawDataId);
                        var channelId = $('#fav-bubble').attr('class');
                        var channelAvatars = $('#YouTubeUserTopInfoAvatar').attr('src');
                        channel_Avatars.push(channelAvatars);
                        channel_Ids.push(channelId);
                        channel_DataJSON[indexInArray] = {id: channelId, title: channel_DataJSON[indexInArray].title, avatar: channelAvatars};
                        if(isLastElement)
                        {
                            console.log('last');
                            var channel_DataJSON_str = JSON.stringify(channel_DataJSON);
                            //write File
                            fs.writeFile("data.dat", channel_DataJSON_str, function(err) {
                                if(err) {
                                    console.log(err);
                                }
                            });
                            if(!(jQuery('#flexSwitchCheckDefault').is(":checked")))
                            {
                                jQuery('#example2ModalSm').fadeOut('200');
                            }
                            renderChannel(channel_DataJSON);
                        }
                    })
                    .catch((error) => {
                        console.log(error)
                    });
                });
            })
            .catch((error) => {
                console.log(error)
            });
        }
    }
}

function renderChannel(data)
{
    var count = 1;
    jQuery.each(data, function (indexInArray, dataItem) {
        if(indexInArray == limit)
        {
            return false;
        }
        if((dataItem.title).length>20)
        {
            var trimmed_title = (dataItem.title).substring(0, 20)+"...";
        }
        else
        {
            var trimmed_title = (dataItem.title);
        }
        var titleZ = String(dataItem.title);
        titleZ = titleC.toLowerCase()
        if(!(exclude_list.includes(titleZ)))
        {
            var channelDiv = '<div data-sort="0" class="channelCard" id="'+dataItem.id+'"><div class="count_holder">--</div><img class="thumbnail" src="'+dataItem.avatar+'" alt=""><div class="data_holder"><div class="channel_title">'+trimmed_title+'</div><div class="subcount odometer" id="'+dataItem.id+'_subcount">000,000,000</div></div></div>'; 
            jQuery('#channelsList').append(channelDiv);
            var selector_id = "#"+dataItem.id+"_subcount";
            fetchSubsInit(dataItem.id,selector_id)
        }
        else
        {
            limit++;
        }
    });
    getCount(data);
}

function httpGet2(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, true ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

async function fetchSubsInit(id,selector) {
    const response = await fetch("https://api.socialcounts.org/youtube-live-subscriber-count/"+id);
    const result_subs = await response.json();
    var intval = result_subs.est_sub;
    var selector2 = "#"+id;
    jQuery(selector2).attr('data-sort',intval);
    var el = document.querySelector(selector);
    init_list.push(intval);
    od = new Odometer({
        el: el,
        value: intval,
        format: '(,ddd)',
    });  
    sortDivs();
}

function getCount(data) 
{
    if(called == 0)
    {
        sortDivs();
        called == 1
    }
    jQuery.each(data, function (indexInArray, dataItem) {
        if(indexInArray == limit)
        {
            return false;
        }
        if(typeof(dataItem.id) != "undefined")
        {
            jQuery.ajax({
                type: "GET",
                url: "https://api.socialcounts.org/youtube-live-subscriber-count/"+dataItem.id,
                success: function (response) {
                    var id_selector = '#'+dataItem.id+'_subcount';
                    var id_s = '#'+dataItem.id;
                    var current_val = parseInt(jQuery(id_s).attr('data-sort'));
                    curr_list.push(response.est_sub);
                    if(current_val != response.est_sub)
                    {
                        if(current_val < response.est_sub)
                        {
                            anime({
                            targets: id_selector,
                            keyframes: [
                                {color: '#000'},
                                {color: '#10D100'},
                                {color: '#000'}
                            ],
                            duration: 2000,
                            easing: 'linear',
                            loop: false
                            });
                        }
                        else
                        {
                            anime({
                            targets: id_selector,
                            keyframes: [
                                {color: '#000'},
                                {color: '#FF003D'},
                                {color: '#000'}
                            ],
                            duration: 2000,
                            easing: 'linear',
                            loop: false
                            });
                        }
                    }
                    setTimeout(() => {
                        jQuery(id_selector).html(response.est_sub);
                        jQuery(id_s).attr('data-sort',response.est_sub);
                        promises.push("sent")
                    }, 1500);
                    // sortDivs();
                },
                error: function (error) {
                    promises.push("sent")
                }
            });
        }
    });
    jQuery.when.apply(jQuery, promises).then(function() {
        setTimeout(function () {
            promises = [];
            curr_list.sort();
            curr_list.reverse();
            if(JSON.stringify(init_list)==JSON.stringify(curr_list))
            {
                sortDivs();
            }
            getCount(data);
        }, 4000);
    });
}

function httpGet(theUrl)
{
    return new Promise((resolve, reject) => { 
        setTimeout(function() {
            jQuery.ajax({
                type: "GET",
                url: theUrl,
                dataType: 'text',
                success: function (res) {
                    resolve(res);
                    var perc_val = percentage+"%";
                    jQuery('.progress-bar').css("width",perc_val);
                    jQuery('#val_prog').text(perc_val);
                    percentage++;
                },
                error: function(res)
                {
                    reject(res);
                    if(res.status == 403)
                    {
                        alert("Change Your Network!")
                    }
                }
            });
            
        }, 1000)
        // resolve();
    });

}

function sortdata(data = [], asc = true) {
  const result = [...data];
  const sign = asc ? 1 : -1;
  result.sort((a, b) => (a.subcount - b.subcount) * sign);
  return JSON.stringify(result);
}
function sortDivs()
{
    var result = jQuery('.channelCard').sort(function (a, b) {
        var contentA =parseInt( jQuery(a).data('sort'));
        var contentB =parseInt( jQuery(b).data('sort'));
        return (contentA > contentB) ? -1 : (contentA < contentB) ? 1 : 0;
    });
    var lenth_card = jQuery('.channelCard').length;
    for (let inss = 0; inss < lenth_card; inss++) {
        jQuery('.channelCard').eq(inss).find('.count_holder').html(inss+1);
    }
    jQuery('#channelsList').html(result);
    init_list.sort();
    init_list.reverse();
}
function isEmptyOrSpaces(str){
    return str === null || str.match(/^ *$/) !== null;
}
