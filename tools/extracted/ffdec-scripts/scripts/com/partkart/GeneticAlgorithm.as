package com.partkart
{
   public class GeneticAlgorithm
   {
      
      private var seed:Individual;
      
      private var population:Array;
      
      public function GeneticAlgorithm(adam:Individual, populationsize:int = 9)
      {
         var mutant:Individual = null;
         super();
         this.seed = adam;
         this.population = new Array(this.seed);
         while(this.population.length < populationsize)
         {
            mutant = this.seed.clone();
            mutant.mutate(40);
            this.population.push(mutant);
         }
      }
      
      public function getPending() : Array
      {
         var individual:Individual = null;
         var pending:Array = new Array();
         for each(individual in this.population)
         {
            if(isNaN(individual.fitness))
            {
               pending.push(individual);
            }
         }
         return pending;
      }
      
      public function generationStep() : void
      {
         var individual:Individual = null;
         var newpopulation:Array = null;
         var male:Individual = null;
         var female:Individual = null;
         var children:Array = null;
         var fittest:Individual = this.population[0];
         var averagefitness:Number = 0;
         for each(individual in this.population)
         {
            if(individual.fitness > fittest.fitness)
            {
               fittest = individual;
            }
            averagefitness += individual.fitness;
         }
         averagefitness /= this.population.length;
         this.population.sort(this.sortByFitness);
         newpopulation = new Array(this.population[0]);
         while(newpopulation.length < this.population.length)
         {
            male = this.getRandomIndividual();
            female = male;
            while(female == male)
            {
               female = this.getRandomIndividual();
            }
            children = male.mate(female);
            children[0].mutate(5);
            children[1].mutate(5);
            newpopulation = newpopulation.concat(children);
         }
         this.population = newpopulation;
      }
      
      public function sortByFitness(a:Individual, b:Individual) : int
      {
         if(a.fitness == b.fitness || Math.abs(a.fitness - b.fitness) < 0.00001)
         {
            if(a.secondaryfitness == b.secondaryfitness)
            {
               return 0;
            }
            if(a.secondaryfitness > b.secondaryfitness)
            {
               return -1;
            }
            return 1;
         }
         if(a.fitness > b.fitness)
         {
            return -1;
         }
         return 1;
      }
      
      private function getRandomIndividual() : Individual
      {
         var rand:Number = Math.random();
         var maxprob:Number = 2 / this.population.length;
         var currentlevel:Number = 0;
         for(var i:int = 0; i < this.population.length; i++)
         {
            if(currentlevel < rand && rand < currentlevel + maxprob)
            {
               return this.population[i];
            }
            currentlevel += maxprob;
            maxprob -= 2 / (this.population.length * this.population.length);
         }
         return this.population[0];
      }
   }
}

