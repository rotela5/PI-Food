const { Router } = require('express');
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
const {Recipe , Diet} = require("../db")
const axios = require("axios")
const {API_KEY} = process.env
//
require("dotenv").config();
const {Sequelize} = require("sequelize");

const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);
const getApiInfo = async () =>{
    const apiUrl = await axios.get(`https://api.spoonacular.com/recipes/complexSearch?apiKey=${process.env.API_KEY}&number=100&addRecipeInformation=true`);
    const resultUrl = await apiUrl.data.results.map(r =>{
        return {
            id : r.id,
            title : r.title, // esto seria el name
            image : r.image,
            score : r.spoonacularScore, // esto seria puntuacion
            healthScore : r.healthScore, // esto seria el nivel de comida saludable
            summary : r.summary, // esto seria el resumen del plato
            diets : r.diets.map(d =>{ // esto seria tipo de dieta
                return {name: d } // va tener un objeto que "d" va ser el tipo de dieta , en si va ser un array de objetos . Tambien puede ser un array simple con sus diets 
            }),
            dishTypes : r.dishTypes.map(d =>{ // esto seria el tipo de plato
                return {name : d }
            }),
            steps : r.analyzedInstructions.map(a =>  // esto seria el Paso a paso
                 a.steps.map(s => s.step ) ).flat(2).join(""), // como "analyzedInstructions" tiene es un array dentro con mas arrays , hago dos map() y flat(2) para aplanar el array por ultimo un join("") para unir todo
        }
    })
    return resultUrl
}

const getDbInfo = async () =>{    //aca voy traer lo que guardo en la base de datos(date base)
    return await Recipe.findAll({
        include :{
            model: Diet,
            attributes:["name"],
            through:{
                attributes: [],
            }
        }
    })
}

const allData = async () =>{ // con esto creo una funcion que trae tadas las recetas lo que venga por la api de food y lo de la base datos
    const apiInfo = await getApiInfo();
    const dbInfo = await getDbInfo();
    const infoTotal = apiInfo.concat(dbInfo);
    return infoTotal
}

router.get("/recipes", async(req, res) =>{ // trae todas las recetas o trae un listado de recetas por el name de query
    const name = req.query.name; // busco por query name
    let recetas = await allData(); // creo una varieble "recetas" que traiga todo con la funcion allData() que cree , "recetas" va ser un array con toda la informacion
    if(name){ // si hay algo en name
        let nameReceta = await recetas.filter(r => r.title.toLowerCase().includes(name.toLowerCase()) ); // hago un filter que traiga lo que tenga ese "name"
        if(nameReceta.length > 0){ // como "nameReceta" es un array , me fijo si hay algo
            return res.status(200).send(nameReceta); // si hay lo retorno con res.status()
        }else{
            return res.status(404).send("No esta la receta ingresada") // sino envio un error
        }
    }
    return res.status(200).send(recetas) // si no hay nada por query , muestra todas las "recetas"
})

router.get("/recipes/:idReceta", async (req, res) =>{ // trae una receta particular por id
    const {idReceta} = req.params; // hago un destructuring para obtener "idReceta"
    const recetasTotal = await allData(); // utilizo la funcion que cree allData() para traer todas las recetas
    if(idReceta){ // si hay "idReceta"
        // console.log(idReceta)
        let recetaId = await recetasTotal.find( r => parseInt(r.id) === parseInt(idReceta)); // hago un find() para que me devuelva el primer valor que coincida con "idReceta"
        // console.log(recetaId)
        if(recetaId){ // si hay algo en "recetaId"
            return res.status(200).send(recetaId); // lo devuelvo
        }
          return res.status(404).send("This recipe has not been found");
    }
})

router.get("/types",async(req, res) =>{ // obtengo todas las dietas posibles y lo guardo en mi base de datos
    const apiUrl = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${process.env.API_KEY}`);
    const totalDiets = apiUrl.data.results.map(a => a.diets).flat(2); // hago un map sobre el apiUrl.data.results que gaurde todas las dietas , como diets van hacer un array de array hago un flat()  
    // console.log(totalDiets)
    let dietsFilter = totalDiets.filter((element, index)=>{ // hago un filter para eleminar los elementos repetitivos en el array "totalDiets"
        return totalDiets.indexOf(element) === index;
    })
    // console.log(dietsFilter)
    dietsFilter.push("vegetarian") // pusheo "vegetarian" porque no aparece en todas las diets pero si en documentacion de la api de food
    dietsFilter.forEach(t =>{ // hago un forEach para iterar cada elemento =>"t"
        Diet.findOrCreate({ // traigo el modelo Diet.js , utilizo el findOrCreate() de squelize para crear el elemento en mi base de datos, si ya esta no lo crea
            where: {name : t} // creo el objeto where que tenga cada elemento => "t"
        })
    })
    const allDiets = await Diet.findAll(); // guarda en "allDites" lo que esta en la tabla Diet.js con la funcion findall() de squelize
    return res.send(allDiets); 
})

router.post("/recipe", async(req, res) =>{ // recibo los datos por body y lo guardo en mi base de datos , creo la receta
    let {title,
        summary ,
        steps ,
        score,
        healthScore,
        createdInDb, 
        diets,
        image, } = req.body; // traigo todo lo que viene por body con destructuring , esto lo que va traer cuando se cree la receta
        if(!title || !summary){
            return res.status(404).send("Must have title and summary")
        }
        if(!score){ // por default el puntaje va hacer 0
            score=0
        }
        if(!healthScore){ // por default el puntaje va hacer 0
            healthScore=0
        }
    let recipeCreate = await Recipe.create({ // traigo mi models Recipe.js y usa la funcion create()"de sequilize" para crear recipeCreate
        title, 
        summary, 
        steps,
        score, 
        healthScore,
        createdInDb,
        image,  
    });
    let dietsDb = await Diet.findAll({ // aca busto todas las diets que coincidan con la tabla Diet de mi base de datos , findAll() es de squelize
        where: {name: diets}
    })
    recipeCreate.addDiet(dietsDb); // agrego a la tabla Diet con addDiet lo que cree en dietsDb
    return res.send("Recipe successfully created");
})


module.exports = router;
