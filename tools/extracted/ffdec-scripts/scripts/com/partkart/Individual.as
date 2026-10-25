package com.partkart
{
   public class Individual
   {
      
      public var fitness:Number = NaN;
      
      public var secondaryfitness:Number = NaN;
      
      public var genes:Array;
      
      public var data:Array;
      
      public function Individual()
      {
         super();
      }
      
      public function mutate(p:Number) : int
      {
         var rand:Number = NaN;
         var j:int = 0;
         var temp:int = 0;
         if(!this.genes)
         {
            return 0;
         }
         var mutations:int = 0;
         for(var i:int = 0; i < this.genes.length; i++)
         {
            rand = Math.random() * 100;
            if(rand < p)
            {
               mutations++;
               j = i;
               while(j == i)
               {
                  j = Math.round(Math.random() * (this.genes.length - 1));
               }
               temp = int(this.genes[i]);
               this.genes[i] = this.genes[j];
               this.genes[j] = temp;
            }
         }
         return mutations;
      }
      
      public function clone() : Individual
      {
         var clone:Individual = new Individual();
         clone.fitness = this.fitness;
         clone.genes = this.genes.slice();
         return clone;
      }
      
      public function mate(mate:Individual) : Array
      {
         var cutpoint:int = Math.round(Math.random() * ((this.genes.length - 1) * 0.9));
         var gene1:Array = this.genes.slice(0,cutpoint);
         var gene2:Array = mate.genes.slice(0,cutpoint);
         var i:int = 0;
         while(i < this.genes.length)
         {
            if(gene1.indexOf(mate.genes[i]) == -1)
            {
               gene1.push(mate.genes[i]);
            }
            i++;
         }
         i = 0;
         while(i < this.genes.length)
         {
            if(gene2.indexOf(this.genes[i]) == -1)
            {
               gene2.push(this.genes[i]);
            }
            i++;
         }
         var child1:Individual = new Individual();
         child1.genes = gene1;
         var child2:Individual = new Individual();
         child2.genes = gene2;
         return new Array(child1,child2);
      }
   }
}

