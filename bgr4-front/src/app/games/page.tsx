import Link from "next/link"
import Image from "next/image"
import { getGames } from "@/lib/api"
import { Card, CardContent, CardMedia, Typography, Grid, Container } from "@mui/material"

export default async function GameList() {
  const games = await getGames()

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" align="center" gutterBottom>
        ボードゲーム一覧
      </Typography>
      <Grid container spacing={4}>
        {games.map((game) => (
          <Grid item key={game.id} xs={12} sm={6} md={4}>
            <Link href={`/games/${game.id}`} style={{ textDecoration: 'none' }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={game.image_url || "/images/placeholder.jpg"}
                  alt={game.name}
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="h2">
                    {game.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    プレイ人数: {game.min_players}-{game.max_players}人
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    プレイ時間: {game.play_time}分
                  </Typography>
                </CardContent>
              </Card>
            </Link>
          </Grid>
        ))}
      </Grid>
    </Container>
  )
} 