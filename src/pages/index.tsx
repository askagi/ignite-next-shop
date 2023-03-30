import Image from "next/image";
import { HomeContainer, Product } from "../styles/pages/home";

import 'keen-slider/keen-slider.min.css';
import { useKeenSlider } from 'keen-slider/react';


import { GetStaticProps } from "next";
import Stripe from "stripe";
import { stripe } from "../lib/stripe";
import Head from "next/head";

interface HomeProps {
  products: {
    id: string;
    name: string;
    imageUrl: string;
    price: string;
  }[]
}

export default function Home({ products }: HomeProps) {

  const [sliderRef] = useKeenSlider({
    mode: "free-snap",
    slides: {
      perView: 3,
      // origin: "center",
      spacing: 48,

    }
  })
  return (
    <>
      <Head>
        <title>Home | Ignite next Shop</title>
      </Head>
      <HomeContainer ref={sliderRef} className="keen-slider">
        {products.map(product => (
          <Product
            prefetch={false}
            href={`/product/${product.id}`}
            key={product.id}
            className="keen-slider__slide"
          >
            <Image src={product.imageUrl} width={520} height={480} alt="" />
            <footer>
              <strong>{product.name}</strong>
              <span>{product.price}</span>
            </footer>
          </Product>
        ))}

      </HomeContainer>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const response = await stripe.products.list({
    expand: ["data.default_price"]
  });

  const products = response.data.map(product => {
    const price = product.default_price as Stripe.Price

    return {
      id: product.id,
      name: product.name,
      imageUrl: product.images[0],
      price: new Intl.NumberFormat('pt-BR', {
        currency: "BRL",
        style: "currency"
      }).format(Number(price.unit_amount) / 100)
    }
  })

  return {
    props: {
      products,
    },
    revalidate: 60 * 60 * 2 // Acada 2 horas o next vai criar uma nova versao HTML estatica desta paginae armazenar em cache 
  }
}
