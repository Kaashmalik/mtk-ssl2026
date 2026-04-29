"use client"

import { useEffect, useState } from "react"
import { useMatchStore } from "@/stores/use-match-store"
import { useSocket } from "@/hooks/use-socket"
import { Card, CardContent, CardHeader, CardTitle } from "@mtk/ui/components/ui/card"
import { Button } from "@mtk/ui/components/ui/button"
import { Badge } from "@mtk/ui/components/ui/badge"

export default function LiveScoringInterface({ matchId }: { matchId: string }) {
  const store = useMatchStore()
  const { sendMessage } = useSocket({ room: matchId })
  
  // Dummy initialization for demo
  useEffect(() => {
     store.initMatch(matchId, "team1", "team2");
     // Mock setup players
     useMatchStore.setState({
         striker: { id: 'p1', runs: 24, balls: 12, fours: 3, sixes: 1 },
         nonStriker: { id: 'p2', runs: 12, balls: 14, fours: 1, sixes: 0 },
         currentBowler: { id: 'b1', overs: 2.3, runs: 18, wickets: 1, maidens: 0 }
     });
  }, [matchId])

  const handleRun = (runs: number) => {
    store.addRun(runs);
    sendMessage("match-update", useMatchStore.getState());
  }

  const handleWicket = () => {
    store.addWicket("bowled");
    sendMessage("match-update", useMatchStore.getState());
  }

  const runRate = store.overs > 0 ? (store.totalRuns / store.overs).toFixed(2) : "0.00";

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20">
       {/* Score Board */}
       <Card variant="neo" className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
         <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-lg">Batting Team</span>
              <Badge variant="glass" className="bg-red-500/10 text-red-500 border-red-500/20">Live</Badge>
            </div>
            <div className="text-center mb-4">
               <h1 className="text-6xl font-black tabular-nums tracking-tighter">
                  {store.totalRuns}<span className="text-3xl text-muted-foreground font-medium">/{store.wickets}</span>
               </h1>
               <div className="flex justify-center gap-4 mt-2 text-sm text-muted-foreground font-medium">
                  <span>Overs: <span className="text-foreground">{store.overs}</span></span>
                  <span>CRR: <span className="text-foreground">{runRate}</span></span>
               </div>
            </div>
         </CardContent>
       </Card>

       {/* Players on Field */}
       <div className="grid grid-cols-2 gap-4">
          <Card variant="glass" className="col-span-2">
             <CardContent className="p-4 flex flex-col gap-3">
                 <div className="flex justify-between items-center">
                    <span className="font-medium flex items-center gap-2">
                        {store.striker ? 'Striker' : 'Batsman 1'}
                        <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    </span>
                    <span className="font-bold tabular-nums">
                        {store.striker?.runs} <span className="text-xs text-muted-foreground font-normal">({store.striker?.balls})</span>
                    </span>
                 </div>
                 <div className="flex justify-between items-center text-muted-foreground">
                    <span className="font-medium">{store.nonStriker ? 'Non-Striker' : 'Batsman 2'}</span>
                    <span className="font-bold tabular-nums">
                        {store.nonStriker?.runs} <span className="text-xs text-muted-foreground font-normal">({store.nonStriker?.balls})</span>
                    </span>
                 </div>
             </CardContent>
          </Card>
          
          <Card variant="glass" className="col-span-2 bg-blue-500/5 border-blue-500/20">
             <CardContent className="p-4 flex justify-between items-center">
                 <span className="font-medium text-blue-500">Bowler</span>
                 <div className="flex gap-4 text-sm font-medium">
                    <span title="Overs">{store.currentBowler?.overs}</span>
                    <span title="Maidens">{store.currentBowler?.maidens}</span>
                    <span title="Runs">{store.currentBowler?.runs}</span>
                    <span title="Wickets" className="font-bold">{store.currentBowler?.wickets}</span>
                 </div>
             </CardContent>
          </Card>
       </div>

       {/* This Over */}
       <Card variant="glass">
           <CardContent className="p-4 flex items-center gap-2 overflow-x-auto">
               <span className="text-sm font-medium text-muted-foreground shrink-0 mr-2">This Over:</span>
               {store.currentOverBalls.map((ball, i) => (
                   <span key={i} className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0
                      ${ball === 'W' ? 'bg-destructive text-destructive-foreground' : 
                        ball === '4' || ball === '6' ? 'bg-primary text-primary-foreground' : 
                        'bg-muted text-muted-foreground'}`}>
                       {ball}
                   </span>
               ))}
           </CardContent>
       </Card>

       {/* Scoring Controls - Mobile Optimized */}
       <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t z-10">
          <div className="max-w-md mx-auto">
              <div className="grid grid-cols-4 gap-2 mb-2">
                 {[0, 1, 2, 3, 4, 5, 6].map((runs) => (
                    <Button 
                       key={runs} 
                       size="xl" 
                       variant={runs === 4 || runs === 6 ? "gradient-shine" : "secondary"}
                       className={runs === 0 ? 'col-span-2' : ''}
                       onClick={() => handleRun(runs)}
                    >
                       {runs}
                    </Button>
                 ))}
                 <Button size="xl" variant="destructive" onClick={handleWicket}>W</Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                 <Button variant="outline" className="col-span-1">Wd</Button>
                 <Button variant="outline" className="col-span-1">Nb</Button>
                 <Button variant="outline" className="col-span-1">Lb</Button>
                 <Button variant="outline" className="col-span-1" onClick={store.undoLastBall}>Undo</Button>
              </div>
          </div>
       </div>
    </div>
  )
}
