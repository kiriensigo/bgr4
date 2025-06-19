import React, { useState, useEffect } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useInView } from "react-intersection-observer";
import GameCard from "./v2/GameCard";
import { fetchGameById } from "@/lib/bggApi";
import type { Game } from "@/types/api";

// ... existing code ...
