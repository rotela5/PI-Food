const {Router}=require('express');
const {Recipe, Diet}=require('../db');
const axios= require('axios');
require('dotenv').config();
const {API_KEY}=process.env;

const router=Router();

const getfoodApi=async()=>{
    try{
    
       const food=[];// creo un array para pushar lo que raigo de la api
       let url=`http://api.raw.io//food?key=${API_KEY}`;
       true
       for (let i=1;i<=5;i++){
           let pages=await axios.get(url);//hago lallamada ala api para traer la info
           pages.data.results.Map(g=>{
               food.push({
                id:g.id,
                name:g.name,
                resumenDelPlato:g.resumenDelPlato,
                nivelComidaSaludable:g.nivelComidaSaludable,
                pasoApaso:g.pasoApaso
                
               })
           })
           url=pages.data.next;//le devuelco el valor a la url ingresando ala siguiente pagina
       }
      return food;

    }catch(error){return error}
}
//get info db
const getfooDatabase=async function(){
    try{
        let dataBase=await Recipe.findAll({
            includes:{
                model:Diet,
                atribute:['name'],
                through:{
                    atribute:[]
                },
            }
        })
        return dataBase

    }catch(error){return error}
}

//mix api y db
const getinfoAll= async function(){
    try{
        let apiData= await getfoodApi();
        let dbData= await getfooDatabase();
        const totalData=apiData.concat(dbData);
        return totalData;

    }catch(error){return error}
}

//rutas get/food
router.get('/recipe',async function(req,res){
    const name=req.query.name;//trae de la ruta
    try{
        let allFood= await getinfoAll();//trae todo
        
        if(name){
            let recipeName=await allFood.filter(g=>g.name.toLowerCase().includes(name.toLocaleLowerCase()));
            if(recipeName.length){
                res.status(200).json(recipeName);
            }else{
                res.status(404).send("no se ecnontro la receta")
            }

        }

    }catch(error){return(error)}
})


module.exports=router;