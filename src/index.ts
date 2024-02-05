import axios from "axios";
import * as fs from "fs/promises"
import path = require("path");

const thePath = path.join(__dirname, "../data/result.json")
const headers = { 'Accept': 'application/json, text/plain, */*', 'Accept-Encoding': 'gzip, deflate, br', 'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7', 'Cache-Control': 'no-cache', 'Origin': 'https://franime.fr', 'Pragma': 'no-cache', 'Referer': 'https://franime.fr/', 'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Opera GX";v="106"', 'Sec-Ch-Ua-Mobile': '?0', 'Sec-Ch-Ua-Platform': '"Windows"', 'Sec-Fetch-Dest': 'empty', 'Sec-Fetch-Mode': 'cors', 'Sec-Fetch-Site': 'same-site', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0', };

const createUrl = (id: number, s: number, e: number, l: string, i: number) => `https://api.franime.fr/api/anime/${id}/${s}/${e}/${l}/${i}`

async function main() {
    const data = JSON.parse(await fs.readFile(thePath, "utf8"))

    for (const anime of data) {
        const fina_result = JSON.parse(await fs.readFile(thePath.replace("result", "data"), "utf8") || "{}")

        if (!fina_result[anime.title]) {
            fina_result[anime.title] = {
                title: anime.title,
                titleO: anime.titleO,
                titles: anime.titles,
                description: anime.description,
                categories: anime.themes,
                nsfw: anime.nsfw,
                banner: anime.banner,
                poster: anime.affiche,
                saisons: {},
            }
        }

        await fs.writeFile(thePath.replace("result", "data"), JSON.stringify(fina_result, null, 2))

        for (const saison of anime.saisons) {
            const saisonIndex = anime.saisons.indexOf(saison);

            const fina_result = JSON.parse(await fs.readFile(thePath.replace("result", "data"), "utf8"))
            if (!fina_result[anime.title]["saisons"][saison.title]) {
                fina_result[anime.title]["saisons"][saison.title] = {}
            }
            await fs.writeFile(thePath.replace("result", "data"), JSON.stringify(fina_result, null, 2))


            for (const episode of saison.episodes) {

                const fina_result = JSON.parse(await fs.readFile(thePath.replace("result", "data"), "utf8"))
                if (!fina_result[anime.title]["saisons"][saison.title][episode.title]) {
                    fina_result[anime.title]["saisons"][saison.title][episode.title] = {}

                    const lestrucptn: { [key: string]: { [key: string]: string } } = {}

                    const episodeIndex = saison.episodes.indexOf(episode);
                    for (const [lang, _] of Object.entries(episode.lang)) {
                        const lecteurs = episode.lang[lang].lecteurs;
                        if (!lestrucptn[lang]) { lestrucptn[lang] = {} }

                        if (lecteurs.length) {
                            const sibnetIndex = lecteurs.indexOf("sibnet")
                            const sendvidIndex = lecteurs.indexOf("sendvid")

                            if (sibnetIndex !== -1) {
                                const url = createUrl(anime.id, saisonIndex, episodeIndex, lang, sendvidIndex)
                                console.log(`-> ${anime.titleO} s${saisonIndex + 1} ep${episodeIndex} lang=${lang} lecteur=sibnet`)
                                var response = await axios.get(url, { headers })
                                if (response.status === 429) {
                                    await new Promise(resolve => setTimeout(() => resolve(""), 6e3));
                                    if (response.statusText === "Too Many Requests") {
                                        await new Promise(resolve => setTimeout(() => resolve(""), 30e3));
                                    }
                                    response = await axios.get(url, { headers })
                                }
                                if (response.data) {
                                    lestrucptn[lang]["sibnet"] = response.data
                                }
                                await new Promise(resolve => setTimeout(() => resolve(""), 500));
                            }

                            if (sendvidIndex !== -1) {
                                const url = createUrl(anime.id, saisonIndex, episodeIndex, lang, sendvidIndex)
                                console.log(`-> ${anime.titleO} s${saisonIndex + 1} ep${episodeIndex} lang=${lang} lecteur=sendvid`)
                                var response = await axios.get(url, { headers })
                                if (response.status === 429) {
                                    await new Promise(resolve => setTimeout(() => resolve(""), 6e3));
                                    if (response.statusText === "Too Many Requests") {
                                        await new Promise(resolve => setTimeout(() => resolve(""), 30e3));
                                    }
                                    response = await axios.get(url, { headers })
                                }
                                if (response.data) {
                                    lestrucptn[lang]["sendvid"] = response.data
                                }

                                await new Promise(resolve => setTimeout(() => resolve(""), 500));
                            }
                            await new Promise(resolve => setTimeout(() => resolve(""), 100));
                        }
                    }

                    fina_result[anime.title]["saisons"][saison.title][episode.title] = lestrucptn
                    await fs.writeFile(thePath.replace("result", "data"), JSON.stringify(fina_result, null, 2))
                }
            }
        }
    }
}

console.clear()
main()