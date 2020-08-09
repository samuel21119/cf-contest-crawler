const fs = require("fs");
const path = require("path");
const request = require("request");
const JSSoup = require('jssoup').default;
const setCookie = require("set-cookie-parser");
UserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:68.0) Gecko/20100101 Firefox/68.0';

const cookie = ""; // Enter your codeforces' session cookies
const contest = "group/jyBrZLV4j8/contest/290163"; // contest url
var headers = {
    "Cookie":  cookie,
    "User-Agent": UserAgent,
    "Connection": "keep-alive",
    "Accept-Language": "en-US,en;q=0.5"
};

const url = `https://codeforces.com/${contest}/status`;

var submission = {}, users = {};
var cnt = 0;
var problem_cnt = 0;
request.get({url: url, headers: headers}, (err, resp, body) => {
    var soup = new JSSoup(body);
    // Find max pages
    var mxpage = 0;
    var pages = soup.findAll("span", "page-index");
    //console.log(pages);
    for (var i = 0; i < pages.length; i++) {
        var tmp = pages[i].attrs.pageIndex;
        mxpage = max(mxpage, parseInt(tmp));
    }
    console.log(`Page: ${mxpage}`);
    getStatus(mxpage);
});
function getStatus(curpage) {
    if (curpage <= 0) {
        var out = {};
        out["problem_count"] = problem_cnt,
        out["solutions"] = submission;
        out["users"] = users;
        fs.writeFileSync('data.json', JSON.stringify(out, null, 2), 'utf-8'); 
        return;
    }
    request.get({url: `${url}/page/${curpage}`, headers: headers}, async(err, resp, body) => {
        var soup2 = new JSSoup(body);
        var table = soup2.find("table", "status-frame-datatable");
        var tr = table.findAll("tr");
        for (var i = tr.length - 1; i > 0; i--) {
            var user = tr[i].find("a", "rated-user").getText();
            var problem = tr[i].findAll("td", "status-small")[1].find("a").attrs.href; problem = problem[problem.length-1];
            var verdict = tr[i].find("a", "information-box-link").getText();
            if (verdict.indexOf("Perfect") != -1 || verdict.indexOf("Accepted"))
                verdict = "AC";
            else if (verdict.indexOf("Partial result: ") != -1) {
                var key = "Partial result: ";
                ind = verdict.indexOf(key) + key.length;
                tmp = "P";
                while (verdict[ind] != ' ')
                    tmp += verdict[ind++];
                verdict = tmp;
            }else
                verdict = "P0";

            console.log(cnt, user, problem, verdict);
            cnt++;
            problem = problem.charCodeAt(0) - 64;
            problem_cnt = max(problem_cnt, problem);
            submission[`${cnt}`] = {
                "user_id": user,
                "problem_index": problem,
                "verdict": verdict,
                "submitted_seconds": cnt
            }
            users[user] = {
                "name": user,
                "college": "IONCAMP",
                "is_exclude": false
            }
           // submission.append(add);
        }
        await sleep(150);
        getStatus(curpage - 1);
    })
}
function max(a, b) {
    return a > b ? a : b;
}
async function sleep(ms = 0) {
    return new Promise(r => setTimeout(r, ms));
}
